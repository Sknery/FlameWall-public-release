import { Injectable, NotFoundException, ConflictException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { LinkCode } from './entities/link-code.entity';
import { randomBytes } from 'crypto';


@Injectable()
export class LinkingService {
  private readonly logger = new Logger(LinkingService.name);

  constructor(
    @InjectRepository(LinkCode)
    private linkCodeRepository: Repository<LinkCode>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }


  async generateCodeForUser(userId: number): Promise<string> {
    await this.linkCodeRepository.delete({ userId });

    const user = await this.usersRepository.findOneBy({ id: userId });

    if (!user) {
      this.logger.error(`[CODE-GEN-FAIL] ❌ Attempted to generate code for a non-existent User ID: ${userId}.`);
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    if (user.minecraft_uuid) {
      this.logger.warn(`[CODE-GEN-FAIL] ⚠️ User ID: ${userId} (${user.username}) attempted to generate a code but already has a linked account.`);
      throw new ConflictException('This website account is already linked to a Minecraft account.');
    }

    const code = randomBytes(3).toString('hex').toUpperCase();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    const newLinkCode = this.linkCodeRepository.create({ code, userId, expires_at });

    await this.linkCodeRepository.save(newLinkCode);
    this.logger.log(`[CODE-GEN-SUCCESS] ✅ Generated new link code '${code}' for User ID: ${userId}.`);
    return code;
  }


  async verifyCodeAndLinkAccount(code: string, minecraftUuid: string, minecraftUsername: string): Promise<User> {
    this.logger.log(`[VERIFY-LINK] 🔗 Verifying code '${code}' for MC UUID: ${minecraftUuid} (${minecraftUsername}).`);

    if (minecraftUuid.charAt(14) !== '4') {
      this.logger.warn(`[VERIFY-FAIL] 🚫 Offline-mode UUID detected for user ${minecraftUsername}. Aborting link.`);
      throw new ForbiddenException('Only licensed Minecraft accounts are allowed to be linked.');
    }

    const linkCode = await this.linkCodeRepository.findOne({ where: { code } });

    if (!linkCode || linkCode.expires_at < new Date()) {
      this.logger.warn(`[VERIFY-FAIL] ⚠️ Invalid or expired link code '${code}' used by MC UUID: ${minecraftUuid}.`);
      throw new NotFoundException('Invalid or expired link code.');
    }

    const [userToUpdate, existingLinkedUser] = await Promise.all([
      this.usersRepository.findOneBy({ id: linkCode.userId }),
      this.usersRepository.findOneBy({ minecraft_uuid: minecraftUuid })
    ]);

    if (existingLinkedUser) {
      this.logger.warn(`[VERIFY-FAIL] ⚠️ Conflict. MC UUID ${minecraftUuid} is already linked to User ID: ${existingLinkedUser.id} (${existingLinkedUser.username}).`);
      throw new ConflictException('This Minecraft account is already linked to another website account.');
    }

    if (!userToUpdate) {
      this.logger.error(`[VERIFY-FAIL] ❌ User account associated with code '${code}' (User ID: ${linkCode.userId}) not found.`);
      await this.linkCodeRepository.remove(linkCode);
      throw new NotFoundException('User associated with this code not found.');
    }

    userToUpdate.minecraft_uuid = minecraftUuid;
    userToUpdate.minecraft_username = minecraftUsername;

    const savedUser = await this.usersRepository.save(userToUpdate);
    await this.linkCodeRepository.remove(linkCode);

    this.logger.log(`[VERIFY-SUCCESS] ✅ Successfully linked User ID: ${savedUser.id} (${savedUser.username}) with MC UUID: ${minecraftUuid}.`);
    return savedUser;
  }
}
