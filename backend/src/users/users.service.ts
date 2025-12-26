import { Injectable, NotFoundException, ConflictException, ForbiddenException, InternalServerErrorException, Logger, forwardRef, Inject, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, ILike, FindManyOptions, DataSource, In, EntityManager, IsNull, LessThan } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { JwtService } from '@nestjs/jwt';
import { AdminUpdateUserDto } from '../admin/dto/admin-update-user.dto';
import { RanksService, SystemRanks } from '../ranks/ranks.service';
import { Rank } from '../ranks/entities/rank.entity';
import { PendingCommand } from '../shop/entities/pending-command.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Post } from '../posts/entities/post.entity';
import { FindAllPostsDto } from '../posts/dto/find-all-posts';
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { BanUserDto } from '../admin/dto/ban-user.dto';
import { ClanMember } from 'src/clans/entities/clan-member.entity';
import { Clan } from 'src/clans/entities/clan.entity';
import { Follow } from './entities/follow.entity';
import { Purchase } from 'src/purchases/entities/purchase.entity';
import { ShopItemType } from 'src/shop/entities/shop-item.entity';
import { TagsService } from 'src/tags/tags.service';

export type PublicUser = Omit<User, 'password_hash' | 'validatePassword' | 'deleted_at'>;

@Injectable()
export class UsersService implements OnModuleInit {

  private readonly logger = new Logger(UsersService.name);
  private domPurify;
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PendingCommand)
    private pendingCommandsRepository: Repository<PendingCommand>,
    private readonly eventEmitter: EventEmitter2,
    private jwtService: JwtService,
    private ranksService: RanksService,
    private readonly dataSource: DataSource,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private readonly tagsService: TagsService,
  ) {
    const window = new JSDOM('').window;
    this.domPurify = DOMPurify(window);
  }

  onModuleInit() {
    this.cleanupUnverifiedUsers();

    setInterval(() => {
        this.cleanupUnverifiedUsers();
    }, 3600000);
  }


  async cleanupUnverifiedUsers() {
      try {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

          const usersToDelete = await this.usersRepository.find({
              select: { id: true },
              where: {
                  email_verified_at: IsNull(),
                  first_login: LessThan(twentyFourHoursAgo)
              }
          });

          if (usersToDelete.length === 0) return;

          const userIds = usersToDelete.map(u => u.id);

          await this.dataSource
              .createQueryBuilder()
              .delete()
              .from(Clan)
              .where("owner_id IN (:...ids)", { ids: userIds })
              .execute();

          const result = await this.usersRepository.delete({
              id: In(userIds)
          });

          if (result.affected && result.affected > 0) {
              this.logger.log(`[CLEANUP] 🧹 Deleted ${result.affected} unverified users who expired (and their clans).`);
          }
      } catch (error) {
          this.logger.error(`[CLEANUP-FAIL] Failed to cleanup unverified users: ${error.message}`);
      }
  }

  async create(createUserDto: CreateUserDto, isVerified: boolean = true, manager?: EntityManager): Promise<User> {
    const { email, username, password } = createUserDto;

    const repository = manager ? manager.getRepository(User) : this.usersRepository;

    const totalUsers = await repository.count();
    let rankToAssign;
    try {
      rankToAssign = totalUsers === 0 ? await this.ranksService.findOwnerRank() : await this.ranksService.findDefaultRank();
    } catch (error) {
      this.logger.error(`[CREATE-FAIL] 🔥 CRITICAL: Could not find system ranks.`, error.stack);
      throw new InternalServerErrorException('Could not determine rank for new user.');
    }
    const existingUserByEmail = await repository.findOne({ where: { email } });
    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userToCreate = repository.create({
        username,
        email,
        password_hash: hashedPassword,
        rank: rankToAssign,
        email_verified_at: isVerified ? new Date() : null,
    });

    return repository.save(userToCreate);
  }

  async saveVerificationToken(userId: number, token: string, expires: Date, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(User) : this.usersRepository;
    await repository.update(userId, {
        email_verification_token: token,
        email_verification_token_expires: expires,
    });
  }

  async findUserByVerificationToken(token: string): Promise<User | null> {
      return this.usersRepository.findOne({
          where: {
              email_verification_token: token,
          }
      });
  }

  async findUserByEmailChangeToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        email_change_token: token,
      },
    });
  }

  async findUserByPasswordResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        password_reset_token: token,
      },
    });
  }

  async findUserByEmailOrPendingEmail(email: string): Promise<User | null> {
      return this.usersRepository.findOne({
          where: [
              { email: email },
              { pending_email: email }
          ]
      });
  }

  async findUserByEmail(email: string): Promise<User | null> {
      return this.usersRepository.findOne({
          where: { email: email }
      });
  }

  async updateProfile(userId: number, updateUserDto: UpdateUserDto): Promise<{ user: PublicUser, access_token: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['rank', 'clanMembership', 'clanMembership.clan', 'clanMembership.role', 'tags', 'profile_frame', 'animated_avatar', 'animated_banner'] });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    if (updateUserDto.profile_slug) {
      const existingSlugUser = await this.usersRepository.findOne({
        where: { profile_slug: updateUserDto.profile_slug, id: Not(userId) }
      });
      if (existingSlugUser) {
        throw new ConflictException('This profile URL slug is already taken.');
      }
    }

    if (updateUserDto.description) {
      updateUserDto.description = this.domPurify.sanitize(updateUserDto.description);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);

    const finalUser = await this.findOne(updatedUser.id);

    const jwtTokenPayload = {
      username: finalUser.username,
      sub: finalUser.id,
      rank: finalUser.rank,
      clanMembership: finalUser.clanMembership,
    };
    const newAccessToken = this.jwtService.sign(jwtTokenPayload);

    return { user: finalUser, access_token: newAccessToken };
  }

  async updateUserTags(userId: number, tagIds: number[]): Promise<PublicUser> {
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['tags'] });

    if (!user) {
      this.logger.warn(`[TAG-UPDATE-FAIL] ⚠️ User with ID ${userId} not found.`);
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    if (!tagIds || tagIds.length === 0) {
      user.tags = [];
    } else {
      const tags = await this.tagsService.findByIds(tagIds);
      user.tags = tags;
    }

    await this.usersRepository.save(user);
    return this.findOne(userId);
  }

  async banUser(userId: number, banDto: BanUserDto): Promise<PublicUser> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    user.is_banned = true;
    user.ban_reason = banDto.reason;

    if (banDto.duration_hours) {
      const expires = new Date();
      expires.setHours(expires.getHours() + banDto.duration_hours);
      user.ban_expires_at = expires;
    } else {
      user.ban_expires_at = null;
    }

    const bannedUser = await this.usersRepository.save(user);
    const { password_hash, validatePassword, deleted_at, ...result } = bannedUser;
    return result as PublicUser;
  }

  async unbanUser(userId: number): Promise<PublicUser> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    user.is_banned = false;
    user.ban_reason = null;
    user.ban_expires_at = null;
    const unbannedUser = await this.usersRepository.save(user);
    const { password_hash, validatePassword, deleted_at, ...result } = unbannedUser;
    return result as PublicUser;
  }

  async softDeleteUser(userId: number): Promise<void> {
    const result = await this.usersRepository.softDelete(userId);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
  }

  async adminUpdateUser(targetUserId: number, dto: AdminUpdateUserDto, actorId: number): Promise<PublicUser> {
    this.logger.log(`[ADMIN-UPDATE] 📝 Admin ID: ${actorId} is updating User ID: ${targetUserId}`);
    const [targetUser, actor] = await Promise.all([
      this.usersRepository.findOne({ where: { id: targetUserId }, relations: ['rank'] }),
      this.usersRepository.findOne({ where: { id: actorId }, relations: ['rank'] }),
    ]);
    if (!targetUser) throw new NotFoundException(`User with ID ${targetUserId} not found.`);
    if (!actor) throw new ForbiddenException('Actor performing the action not found.');
    if (actor.id !== targetUser.id && actor.rank.power_level <= targetUser.rank.power_level) {
      throw new ForbiddenException('You cannot modify a user with an equal or higher rank.');
    }
    if (dto.rank_id) {
      const newRank = await this.ranksService.findOne(dto.rank_id);
      const oldRank = targetUser.rank;
      if (actor.rank.power_level <= newRank.power_level) {
        throw new ForbiddenException(`You do not have permission to assign the rank "${newRank.name}".`);
      }
      targetUser.rank = newRank;
      let commandToQueue: string | null = null;
      if (targetUser.minecraft_username) {
        if (newRank.id === SystemRanks.DEFAULT.id && oldRank?.command_template_remove) {
          commandToQueue = oldRank.command_template_remove.replace('{username}', targetUser.minecraft_username);
        } else if (newRank.command_template) {
          commandToQueue = newRank.command_template.replace('{username}', targetUser.minecraft_username);
        }
      }
      if (commandToQueue) {
        const pendingCommand = this.pendingCommandsRepository.create({ command: commandToQueue });
        await this.pendingCommandsRepository.save(pendingCommand);
        this.eventEmitter.emit('command.queued');
        this.logger.log(`[ADMIN-UPDATE] Queued command and emitted 'command.queued' event: "${commandToQueue}"`);
      }
    }
    if (dto.reputation_count !== undefined) {
      targetUser.reputation_count = dto.reputation_count;
    }
    if (dto.is_verified_youtuber !== undefined) {
      targetUser.is_verified_youtuber = dto.is_verified_youtuber;
    }
    const updatedUser = await this.usersRepository.save(targetUser);
    this.logger.log(`[ADMIN-UPDATE-SUCCESS] ✅ User ID: ${targetUserId} was successfully updated by Admin ID: ${actorId}.`);
    const { password_hash, validatePassword, deleted_at, ...result } = updatedUser;
    return result as PublicUser;
  }

  async findAll(queryDto: FindAllUsersDto): Promise<{ data: PublicUser[], total: number }> {
    const { search, order = 'DESC', sortBy: requestedSortBy = 'first_login', page = 1, limit = 15, tagIds } = queryDto;

    const allowedSortFields: (keyof User)[] = ['username', 'reputation_count', 'first_login'];
    const sortBy = allowedSortFields.includes(requestedSortBy as keyof User) ? requestedSortBy : 'first_login';

    const queryBuilder = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.rank', 'rank')
      .leftJoinAndSelect('user.clanMembership', 'clanMembership')
      .leftJoinAndSelect('clanMembership.clan', 'clan')
      .leftJoinAndSelect('user.profile_frame', 'profile_frame')
      .leftJoinAndSelect('user.animated_avatar', 'animated_avatar')
      .leftJoinAndSelect('user.animated_banner', 'animated_banner')
      .leftJoinAndSelect('clanMembership.role', 'clanRole')
      .leftJoinAndSelect('user.tags', 'tag');

    if (search) {
      queryBuilder.where('user.username ILIKE :search', { search: `%${search}%` });
    }

    if (tagIds && tagIds.length > 0) {
      queryBuilder.andWhere(qb => {
          const subQuery = qb.subQuery()
              .select('ut.user_id')
              .from('user_tags', 'ut')
              .where('ut.tag_id IN (:...tagIds)', { tagIds })
              .groupBy('ut.user_id')
              .having('COUNT(DISTINCT ut.tag_id) = :tagCount', { tagCount: tagIds.length })
              .getQuery();
          return 'user.id IN ' + subQuery;
      });
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy(`user.${sortBy}`, order as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const users = await queryBuilder.getMany();

    const publicUsers = users.map(user => {
      const { password_hash, validatePassword, deleted_at, ...result } = user;
      return result as PublicUser;
    });

    return {
      data: publicUsers,
      total: total,
    };
  }

  async findOne(identifier: string | number): Promise<PublicUser> {
    const isNumeric = typeof identifier === 'number' || /^\d+$/.test(String(identifier));

    const queryBuilder = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.rank', 'rank')
      .leftJoinAndSelect('user.clanMembership', 'clanMembership')
      .leftJoinAndSelect('clanMembership.clan', 'clan')
      .leftJoinAndSelect('user.profile_frame', 'profile_frame')
      .leftJoinAndSelect('user.animated_avatar', 'animated_avatar')
      .leftJoinAndSelect('user.animated_banner', 'animated_banner')
      .leftJoinAndSelect('clanMembership.role', 'clanRole')
      .leftJoinAndSelect('user.tags', 'tags');

    if (isNumeric) {
      queryBuilder.where('user.id = :identifier', { identifier: Number(identifier) });
    } else {
      queryBuilder.where('user.profile_slug = :identifier', { identifier: String(identifier) });
    }

    const user = await queryBuilder.getOne();

    if (!user) {
      throw new NotFoundException(`User with identifier '${identifier}' not found`);
    }

    const { password_hash, validatePassword, deleted_at, ...result } = user;
    return result as PublicUser;
  }

  async findOneWithPasswordByEmail(email: string): Promise<User | null> {
    return this.usersRepository.createQueryBuilder("user")
      .leftJoinAndSelect('user.rank', 'rank')
      .leftJoinAndSelect('user.profile_frame', 'profile_frame')
      .leftJoinAndSelect('user.animated_avatar', 'animated_avatar')
      .leftJoinAndSelect('user.animated_banner', 'animated_banner')
      .leftJoinAndSelect('user.clanMembership', 'clanMembership')
      .leftJoinAndSelect('clanMembership.clan', 'clan')
      .leftJoinAndSelect('clanMembership.role', 'clanRole')
      .leftJoinAndSelect('user.tags', 'tags')
      .addSelect("user.password_hash")
      .where("user.email = :email", { email })
      .getOne();
  }

  async getOwnedCosmetics(userId: number, itemType: ShopItemType) {
    const purchases = await this.dataSource.getRepository(Purchase).find({
      where: {
        user_id: userId,
        item: {
          item_type: itemType
        }
      },
      relations: ['item']
    });
    const uniqueItems = Array.from(new Map(purchases.map(p => [p.item.item_id, p.item])).values());
    return uniqueItems;
  }

  async equipProfileFrame(userId: number, itemIdToEquip: number | null): Promise<{ user: PublicUser, access_token: string }> {
    if (itemIdToEquip !== null) {
      const ownedFrames = await this.getOwnedCosmetics(userId, ShopItemType.PROFILE_FRAME);
      const hasItem = ownedFrames.some(item => item.item_id === itemIdToEquip);
      if (!hasItem) {
        throw new ForbiddenException("You do not own this frame.");
      }
    }

    await this.usersRepository.update(userId, { profile_frame_id: itemIdToEquip });

    const finalUser = await this.findOne(userId);
    if (!finalUser) {
      throw new NotFoundException('User not found after update.');
    }

    const jwtTokenPayload = {
      username: finalUser.username,
      sub: finalUser.id,
      rank: finalUser.rank,
      clanMembership: finalUser.clanMembership,
    };
    const newAccessToken = this.jwtService.sign(jwtTokenPayload);

    return { user: finalUser, access_token: newAccessToken };
  }

  async equipAnimatedAvatar(userId: number, itemIdToEquip: number | null): Promise<{ user: PublicUser, access_token: string }> {
    if (itemIdToEquip !== null) {
      const ownedAvatars = await this.getOwnedCosmetics(userId, ShopItemType.ANIMATED_AVATAR);
      const hasItem = ownedAvatars.some(item => item.item_id === itemIdToEquip);
      if (!hasItem) {
        throw new ForbiddenException("You do not own this animated avatar.");
      }
    }

    await this.usersRepository.update(userId, { animated_avatar_id: itemIdToEquip });

    const finalUser = await this.findOne(userId);
    if (!finalUser) {
      throw new NotFoundException('User not found after update.');
    }

    const jwtTokenPayload = {
      username: finalUser.username,
      sub: finalUser.id,
      rank: finalUser.rank,
      clanMembership: finalUser.clanMembership,
    };
    const newAccessToken = this.jwtService.sign(jwtTokenPayload);

    return { user: finalUser, access_token: newAccessToken };
  }

  async equipAnimatedBanner(userId: number, itemIdToEquip: number | null): Promise<{ user: PublicUser, access_token: string }> {
    if (itemIdToEquip !== null) {
      const ownedBanners = await this.getOwnedCosmetics(userId, ShopItemType.ANIMATED_BANNER);
      const hasItem = ownedBanners.some(item => item.item_id === itemIdToEquip);
      if (!hasItem) {
        throw new ForbiddenException("You do not own this animated banner.");
      }
    }

    await this.usersRepository.update(userId, { animated_banner_id: itemIdToEquip });

    const finalUser = await this.findOne(userId);
    if (!finalUser) {
      throw new NotFoundException('User not found after update.');
    }

    const jwtTokenPayload = {
      username: finalUser.username,
      sub: finalUser.id,
      rank: finalUser.rank,
      clanMembership: finalUser.clanMembership,
    };
    const newAccessToken = this.jwtService.sign(jwtTokenPayload);

    return { user: finalUser, access_token: newAccessToken };
  }

  async updatePassword(userId: number, newHashedPassword: string): Promise<void> {
    await this.usersRepository.update(userId, { password_hash: newHashedPassword });
  }

  async findOneWithPasswordById(id: number): Promise<User | null> {
    return this.usersRepository.createQueryBuilder("user")
      .addSelect("user.password_hash")
      .where("user.id = :id", { id })
      .getOne();
  }

  async findUserEntityById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async saveUserEntity(user: User, manager?: EntityManager): Promise<User> {
    const repository = manager ? manager.getRepository(User) : this.usersRepository;
    return repository.save(user);
  }

  async updateAvatar(userId: number, avatarUrl: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.pfp_url = avatarUrl;
    return this.usersRepository.save(user);
  }

  async updateBanner(userId: number, bannerUrl: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.banner_url = bannerUrl;
    return this.usersRepository.save(user);
  }

  async findUserByMinecraftUuid(uuid: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ minecraft_uuid: uuid });
  }

  async findOneByMinecraftUsername(mcUsername: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { minecraft_username: mcUsername } });
  }

  async unlinkMinecraftAccount(userId: number): Promise<{ user: PublicUser, access_token: string }> {
    const user = await this.usersRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    user.minecraft_uuid = null;
    user.minecraft_username = null;
    user.is_minecraft_online = false;

    await this.usersRepository.save(user);

    const profileData = await this.findOne(userId);
    const jwtTokenPayload = { username: profileData.username, sub: profileData.id, rank: profileData.rank, clanMembership: profileData.clanMembership };
    const newAccessToken = this.jwtService.sign(jwtTokenPayload);

    return { user: profileData, access_token: newAccessToken };
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['rank'],
    });
  }

  async updateOnlineStatus(minecraftUuid: string, isOnline: boolean): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { minecraft_uuid: minecraftUuid } });
    if (user) {
      user.is_minecraft_online = isOnline;
      await this.usersRepository.save(user);
    }
  }

  async updateRankFromGameEvent(minecraftUuid: string, newRankSystemName: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { minecraft_uuid: minecraftUuid },
      relations: ['rank'],
    });

    if (!user) {
      this.logger.verbose(`[EVENT-SYNC-SKIP] User with UUID ${minecraftUuid} not found for rank sync.`);
      return;
    }

    if (user.rank && user.rank.is_site_only) {
      this.logger.log(`[EVENT-SYNC-SKIP] User ID ${user.id} has a site-only rank "${user.rank.name}". Skipping rank sync from game.`);
      return;
    }

    const newRank = await this.ranksService.findRankBySystemName(newRankSystemName);
    if (!newRank) {
      this.logger.warn(`[EVENT-SYNC-FAIL] Rank "${newRankSystemName}" from game event not found in DB.`);
      return;
    }

    if (user.rank_id !== newRank.id) {
      user.rank = newRank;
      await this.usersRepository.save(user);
      this.logger.log(`[EVENT-SYNC-SUCCESS] User ID ${user.id} rank updated to "${newRank.name}" based on in-game command event.`);
    }
  }

  async findPostsForUser(userId: number, queryDto: FindAllPostsDto): Promise<{ data: any[], total: number }> {
    const { page = 1, limit = 5 } = queryDto;
    this.logger.verbose(`[DB-QUERY] 💾 Fetching posts for User ID: ${userId} with page: ${page}, limit: ${limit}`);

    const queryBuilder = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoin('post.votes', 'votes')
      .addSelect('COALESCE(SUM(votes.value), 0)', 'score')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .where('post.author_id = :userId', { userId })
      .groupBy('post.id, author.id')
      .orderBy('post.created_at', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    const rawEntities = await queryBuilder.getRawMany();

    const postsWithScores = entities.map(post => {
      const rawPost = rawEntities.find(raw => raw.post_id === post.id);
      return { ...post, score: rawPost ? parseInt(rawPost.score, 10) : 0 };
    });

    this.logger.verbose(`[DB-RESULT] 💾 Found ${total} total posts for user, returning ${postsWithScores.length}.`);
    return { data: postsWithScores, total };
  }

  async validateActiveUser(userId: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['rank', 'clanMembership', 'clanMembership.clan', 'clanMembership.role', 'profile_frame', 'tags'],
    });

    if (!user) {
      this.logger.warn(`[AUTH-VALIDATION] User with ID ${userId} from a valid JWT was not found in the database.`);
      throw new UnauthorizedException('User not found or token is invalid');
    }

    if (user.is_banned && user.ban_expires_at && new Date() > new Date(user.ban_expires_at)) {
      this.logger.log(`[AUTO-UNBAN] ✅ Ban for User ID: ${user.id} has expired during request validation. Unbanning automatically.`);
      user.is_banned = false;
      user.ban_reason = null;
      user.ban_expires_at = null;
      await this.usersRepository.save(user);
    }

    if (user.is_banned) {
      this.logger.warn(`[AUTH-VALIDATION] Banned User ID: ${user.id} attempted to access a protected route.`);
      throw new ForbiddenException('This account has been banned.');
    }

    return user;
  }

  async follow(followerId: number, followingId: number): Promise<void> {
    if (followerId === followingId) {
      throw new ForbiddenException('You cannot follow yourself.');
    }

    const existingFollow = await this.dataSource.getRepository(Follow).findOneBy({
      follower_id: followerId,
      following_id: followingId,
    });

    if (existingFollow) {
      throw new ConflictException('You are already following this user.');
    }

    const follow = this.dataSource.getRepository(Follow).create({
      follower_id: followerId,
      following_id: followingId,
    });

    await this.dataSource.getRepository(Follow).save(follow);
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    const result = await this.dataSource.getRepository(Follow).delete({
      follower_id: followerId,
      following_id: followingId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('You are not following this user.');
    }
  }

  async getFollowingPostsFeed(userId: number, queryDto: FindAllPostsDto): Promise<{ data: any[], total: number }> {
    const { page = 1, limit = 10 } = queryDto;

    const follows = await this.dataSource.getRepository(Follow).find({
      select: ['following_id'],
      where: { follower_id: userId },
    });

    const followingIds = follows.map(f => f.following_id);

    if (followingIds.length === 0) {
      return { data: [], total: 0 };
    }

    const queryBuilder = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('author.rank', 'rank')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .where('post.author_id IN (:...followingIds)', { followingIds })
      .orderBy('post.created_at', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    const [posts, total] = await queryBuilder.getManyAndCount();

    const postsWithScore = posts.map(p => ({ ...p, score: 0, currentUserVote: 0 }));

    return { data: postsWithScore, total };
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.dataSource.getRepository(Follow).findOneBy({
      follower_id: followerId,
      following_id: followingId,
    });
    return !!follow;
  }

  async getFollowingList(userId: number): Promise<User[]> {
    const follows = await this.dataSource.getRepository(Follow).find({
      where: { follower_id: userId },
      relations: ['following', 'following.rank'],
    });

    return follows.map(f => {
      const { password_hash, ...publicUser } = f.following;
      return publicUser as User;
    });
  }
}