import { Controller, Post, Body, UsePipes, ValidationPipe, Request, UseGuards, Get, HttpCode, HttpStatus, Logger, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService, PublicUser } from '../users/users.service';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentication & Profiles')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
      private authService: AuthService,
      private usersService: UsersService,
    ) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async register(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`[REGISTER] 📝 New registration attempt for email: ${createUserDto.email}`);
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`[LOGIN] ➡️ Login attempt for email: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify a user\'s email address using a token from email.' })
  @ApiQuery({ name: 'token', type: String, required: true })
  async verifyEmail(@Query('token') token: string) {
    this.logger.log(`[VERIFY-EMAIL] 📧 Received email verification request with token: ${token.substring(0, 10)}...`);
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend the email verification link.' })
  async resendVerification(@Request() req) {
    const userId = req.user.userId;
    this.logger.log(`[RESEND-VERIFY] 📤 User ID: ${userId} requested a new verification email.`);
    return this.authService.resendVerificationEmail(userId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProfile(@Request() req): Promise<PublicUser> {
    const userId = req.user.userId;
    return this.usersService.findOne(userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.userId;
    this.logger.log(`[PWD-CHANGE] 🔑 User ID: ${userId} is attempting to change password.`);
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }

  @Post('request-email-change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request to change the user\'s email address.' })
  async requestEmailChange(@Request() req, @Body() requestEmailChangeDto: RequestEmailChangeDto) {
    const userId = req.user.userId;
    this.logger.log(`[EMAIL-CHANGE-REQ] User ID: ${userId} initiated email change request to ${requestEmailChangeDto.newEmail}`);
    return this.authService.requestEmailChange(userId, requestEmailChangeDto);
  }

  @Get('confirm-email-change')
  @ApiOperation({ summary: 'Confirm the email address change using a token from email.' })
  @ApiQuery({ name: 'token', type: String, required: true })
  async confirmEmailChange(@Query('token') token: string) {
    this.logger.log(`[EMAIL-CHANGE-CONFIRM] Received email change confirmation request with token: ${token.substring(0, 10)}...`);
    return this.authService.confirmEmailChange(token);
  }

  @Post('request-password-reset')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email.' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    this.logger.log(`[PWD-RESET-REQ] 🔑 Password reset requested for email: ${dto.email}`);
    return this.authService.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a token from email.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    this.logger.log(`[PWD-RESET] 🔑 Password reset attempt with token: ${dto.token.substring(0, 10)}...`);
    return this.authService.resetPassword(dto);
  }
}
