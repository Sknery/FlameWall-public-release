import { Injectable, UnauthorizedException, ForbiddenException, Logger, InternalServerErrorException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService, PublicUser } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailerService } from '../mailer/mailer.service';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { DataSource } from 'typeorm';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private dataSource: DataSource,
  ) { }

  async validateUser(email: string, pass: string): Promise<PublicUser | null> {
    const user: User | null = await this.usersService.findOneWithPasswordByEmail(email);
    if (!user) {
      return null;
    }

    if (user.is_banned && user.ban_expires_at && new Date() > new Date(user.ban_expires_at)) {
      this.logger.log(`[AUTO-UNBAN] ✅ Ban for User ID: ${user.id} has expired. Unbanning automatically.`);
      user.is_banned = false;
      user.ban_reason = null;
      user.ban_expires_at = null;
      await this.usersService.saveUserEntity(user);
    }

    if (user.is_banned) {
      this.logger.warn(`[LOGIN-BANNED] 🚫 Banned User ID: ${user.id} (${email}) attempted to log in.`);
      throw new ForbiddenException('This account has been banned.');
    }

    if (!user.email_verified_at) {
      this.logger.warn(`[LOGIN-DENIED] 🚫 User ID: ${user.id} (${email}) attempted to log in, but email is not verified.`);
      throw new ForbiddenException('Please verify your email address before logging in. Check your inbox.');
    }

    if (await user.validatePassword(pass)) {
      const { password_hash, validatePassword, ...publicData } = user;
      return publicData as PublicUser;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const userPayload: PublicUser | null = await this.validateUser(loginDto.email, loginDto.password);
    if (!userPayload) {
      this.logger.warn(`[LOGIN-FAIL] ❌ Failed login attempt for email: ${loginDto.email}. Invalid credentials.`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`[LOGIN-SUCCESS] ✅ User ${userPayload.username} (ID: ${userPayload.id}) logged in successfully.`);
    const jwtTokenPayload = { username: userPayload.username, sub: userPayload.id, rank: userPayload.rank };
    return {
      access_token: this.jwtService.sign(jwtTokenPayload),
      user: userPayload
    };
  }

  async register(createUserDto: CreateUserDto): Promise<PublicUser> {
    return this.dataSource.transaction(async (manager) => {
      this.logger.log(`[REGISTER-TX] 📝 Транзакция регистрации начата для: ${createUserDto.email}`);

      const newUserEntity = await this.usersService.create(createUserDto, false, manager);
      this.logger.log(`[REGISTER-TX] ✅ Пользователь ${newUserEntity.username} создан в БД (ожидает коммита).`);

      await this.generateAndSendVerification(newUserEntity, manager);
      this.logger.log(`[REGISTER-TX] 📧 Письмо верификации отправлено. Транзакция завершается.`);

      const { password_hash, validatePassword, deleted_at, ...publicData } = newUserEntity;
      return publicData as PublicUser;
    });
  }

  private async generateAndSendVerification(user: User, manager: any): Promise<void> {
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await this.usersService.saveVerificationToken(user.id, token, expires, manager);

    await this.mailerService.sendVerificationEmail(user, token);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.usersService.findUserByVerificationToken(token);

      if (!user) {
        throw new NotFoundException('Invalid or expired verification token.');
      }

      if (user.email_verification_token_expires && user.email_verification_token_expires < new Date()) {
        throw new ForbiddenException('Verification token has expired.');
      }

      user.email_verified_at = new Date();
      user.email_verification_token = null;
      user.email_verification_token_expires = null;
      await this.usersService.saveUserEntity(user, manager);
      return { message: 'Email successfully verified!' };
    });
  }

  async resendVerificationEmail(userId: number): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.usersService.findUserEntityById(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      if (user.email_verified_at) {
        throw new ConflictException('Email is already verified.');
      }
      await this.generateAndSendVerification(user, manager);      return { message: 'A new verification email has been sent.' };
    });
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findOneWithPasswordById(userId);
    if (!user) {
      this.logger.error(`[PWD-CHANGE-FAIL] ❌ Attempted to change password for non-existent User ID: ${userId}`);
      throw new ForbiddenException('User not found.');
    }
    const isPasswordMatching = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password_hash,
    );
    if (!isPasswordMatching) {
      this.logger.warn(`[PWD-CHANGE-FAIL] ❌ User ID: ${userId} failed to change password due to incorrect current password.`);
      throw new UnauthorizedException('Wrong current password.');
    }
    const newHashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.usersService.updatePassword(userId, newHashedPassword);
    this.logger.log(`[PWD-CHANGE-SUCCESS] ✅ User ID: ${userId} successfully updated their password.`);
  }

  async requestEmailChange(userId: number, dto: RequestEmailChangeDto): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const { newEmail, currentPassword } = dto;
      this.logger.log(`[EMAIL-CHANGE-REQ-TX] User ID: ${userId} requested email change to ${newEmail}.`);

      const user = await this.usersService.findOneWithPasswordById(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }

      const isPasswordMatching = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordMatching) {
        this.logger.warn(`[EMAIL-CHANGE-REQ-FAIL] ❌ Incorrect password for User ID: ${userId}.`);
        throw new UnauthorizedException('Incorrect current password.');
      }

      if (user.email === newEmail) {
        throw new BadRequestException('The new email address cannot be the same as the current one.');
      }

      const existingUser = await this.usersService.findUserByEmailOrPendingEmail(newEmail);
      if (existingUser && existingUser.id !== userId) {
        this.logger.warn(`[EMAIL-CHANGE-REQ-FAIL] ❌ New email ${newEmail} is already in use or pending for another user (ID: ${existingUser.id}).`);
        throw new ConflictException('This email address is already in use or pending verification.');
      }

      const token = randomBytes(32).toString('hex');
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);

      user.pending_email = newEmail;
      user.email_change_token = token;
      user.email_change_token_expires = expires;
      await this.usersService.saveUserEntity(user, manager);
      this.logger.log(`[EMAIL-CHANGE-REQ-TX] Password verified for User ID: ${userId}. Sending verification to ${newEmail}...`);

      await this.mailerService.sendEmailChangeVerificationEmail(user, newEmail, token);

      return { message: 'A confirmation email has been sent to your new email address. Please check your inbox.' };
    });
  }

  async confirmEmailChange(token: string): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      this.logger.log(`[EMAIL-CHANGE-CONFIRM-TX] Attempting to confirm email change with token: ${token.substring(0, 10)}...`);

      const user = await this.usersService.findUserByEmailChangeToken(token);

      if (!user || !user.pending_email) {
        this.logger.warn(`[EMAIL-CHANGE-CONFIRM-FAIL] ❌ Invalid or used token.`);
        throw new BadRequestException('Invalid or expired email change token.');
      }

      if (!user.email_change_token_expires || user.email_change_token_expires < new Date()) {
        this.logger.warn(`[EMAIL-CHANGE-CONFIRM-FAIL] ❌ Token expired for User ID: ${user.id}.`);
        user.pending_email = null;
        user.email_change_token = null;
        user.email_change_token_expires = null;
        await this.usersService.saveUserEntity(user, manager);        throw new BadRequestException('Email change token has expired. Please request the change again.');
      }

      const existingUser = await this.usersService.findUserByEmail(user.pending_email);
      if (existingUser && existingUser.id !== user.id) {
        this.logger.warn(`[EMAIL-CHANGE-CONFIRM-FAIL] ❌ Email ${user.pending_email} became occupied during confirmation for User ID: ${user.id}.`);
        user.pending_email = null;
        user.email_change_token = null;
        user.email_change_token_expires = null;
        await this.usersService.saveUserEntity(user, manager);        throw new ConflictException('This email address has been taken. Please try a different one.');
      }

      const oldEmail = user.email;
      user.email = user.pending_email;
      user.pending_email = null;
      user.email_change_token = null;
      user.email_change_token_expires = null;
      user.email_verified_at = new Date();

      await this.usersService.saveUserEntity(user, manager);
      this.logger.log(`[EMAIL-CHANGE-CONFIRM-SUCCESS] ✅ Email for User ID: ${user.id} successfully changed from ${oldEmail} to ${user.email}.`);

      return { message: 'Your email address has been successfully updated!' };
    });
  }

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      this.logger.log(`[PWD-RESET-REQ] 🔑 Password reset requested for email: ${dto.email}`);

      const user = await this.usersService.findUserByEmail(dto.email);
      if (!user) {
        this.logger.warn(`[PWD-RESET-REQ-FAIL] ❌ Password reset requested for non-existent email: ${dto.email}`);
        return { message: 'If an account with that email exists, a password reset link has been sent.' };
      }

      const token = randomBytes(32).toString('hex');
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);

      user.password_reset_token = token;
      user.password_reset_token_expires = expires;
      await this.usersService.saveUserEntity(user, manager);

      await this.mailerService.sendPasswordResetEmail(user, token);
      this.logger.log(`[PWD-RESET-REQ-SUCCESS] ✅ Password reset email sent to User ID: ${user.id} (${dto.email})`);

      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      this.logger.log(`[PWD-RESET] 🔑 Attempting password reset with token: ${dto.token.substring(0, 10)}...`);

      const userRepository = manager.getRepository(User);
      const user = await userRepository.findOne({
        where: {
          password_reset_token: dto.token,
        },
      });

      if (!user) {
        this.logger.warn(`[PWD-RESET-FAIL] ❌ Invalid password reset token.`);
        throw new BadRequestException('Invalid or expired password reset token.');
      }

      if (!user.password_reset_token_expires || user.password_reset_token_expires < new Date()) {
        this.logger.warn(`[PWD-RESET-FAIL] ❌ Password reset token expired for User ID: ${user.id}.`);
        user.password_reset_token = null;
        user.password_reset_token_expires = null;
        await userRepository.save(user);
        throw new BadRequestException('Password reset token has expired. Please request a new one.');
      }

      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
      user.password_hash = hashedPassword;
      user.password_reset_token = null;
      user.password_reset_token_expires = null;
      await userRepository.save(user);

      this.logger.log(`[PWD-RESET-SUCCESS] ✅ Password successfully reset for User ID: ${user.id}`);

      return { message: 'Your password has been successfully reset. You can now log in with your new password.' };
    });
  }
}