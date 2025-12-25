

import { Injectable, ForbiddenException, ConflictException, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { Clan } from './entities/clan.entity';
import { CreateClanDto } from './dto/create-clan.dto';
import { User } from '../users/entities/user.entity';
import { ClanRole } from './entities/clan-role.entity';
import { ClanMember } from './entities/clan-member.entity';
import { FindAllClansDto } from './dto/find-all-clans.dto';
import { ClanJoinType } from './entities/clan.entity';
import { UpdateClanSettingsDto } from './dto/update-clan-settings.dto';
import { ApplyToClanDto } from './dto/apply-to-clan.dto';
import { ClanApplication, ApplicationStatus } from './entities/clan-application.entity';
import { HandleApplicationDto } from './dto/handle-application.dto';
import { UpdateClanDto } from './dto/update-clan.dto';
import { CreateClanRoleDto } from './dto/create-clan-role.dto';
import { UpdateClanRoleDto } from './dto/update-clan-role.dto';
import { ClanMessage, ClanChatChannel } from './entities/clan-message.entity';
import { ClanInvitation, InvitationStatus } from './entities/clan-invitation.entity';
import { InviteMemberDto } from './dto/invite-member.dto';
import { In } from 'typeorm';
import { ClanWarning } from './entities/clan-warning.entity';
import { CreateClanWarningDto } from './dto/create-clan-warning.dto';
import { ClanReview } from './entities/clan-review.entity';
import { CreateClanReviewDto } from './dto/create-clan-review.dto';
import { ClanMemberHistory } from './entities/clan-member-history.entity';
import { MuteClanMemberDto } from './dto/mute-clan-member.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';



type ClanPermissionKey = 'canEditDetails' | 'canEditAppearance' | 'canEditRoles' | 'canEditApplicationForm' | 'canAcceptMembers' | 'canInviteMembers' | 'canUseClanTags' | 'canAccessAdminChat';



@Injectable()
export class ClansService {

    private readonly logger = new Logger(ClansService.name);

    constructor(
        @InjectRepository(Clan)
        private clansRepository: Repository<Clan>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private dataSource: DataSource,
        private eventEmitter: EventEmitter2,
    ) { }


    async create(createClanDto: CreateClanDto, ownerId: number): Promise<Clan> {
        const owner = await this.usersRepository.findOneBy({ id: ownerId });
        if (!owner) {
            throw new NotFoundException('User creating the clan not found.');
        }

        if (!owner.minecraft_uuid) {
            throw new ForbiddenException('You must have a linked Minecraft account to create a clan.');
        }

        const existingMembership = await this.dataSource.getRepository(ClanMember).findOne({
            where: { user_id: ownerId }
        });

        if (existingMembership) {
            throw new ConflictException('You are already a member of a clan and cannot create a new one.');
        }

        const existingClanByTag = await this.clansRepository.findOneBy({ tag: createClanDto.tag });
        if (existingClanByTag) {
            throw new ConflictException(`A clan with the tag @${createClanDto.tag} already exists.`);
        }

        return this.dataSource.transaction(async (manager) => {
            const clanEntity = manager.create(Clan, {
                ...createClanDto,
                owner_id: ownerId,
            });
            const newClan = await manager.save(clanEntity);

            const leaderRole = manager.create(ClanRole, {
                clan_id: newClan.id,
                name: 'Leader',
                color: '#FFD700',
                power_level: 1000,
                permissions: {
                    clanPermissions: {
                        canEditDetails: true, canEditAppearance: true, canEditRoles: true,
                        canEditApplicationForm: true, canAcceptMembers: true, canInviteMembers: true,
                        canUseClanTags: true, canAccessAdminChat: true,
                    },
                    memberPermissions: {
                        maxKickPower: 999, maxMutePower: 999, maxPromotePower: 999,
                        maxDemotePower: 999, maxWarnPower: 999,
                    }
                },
                is_system_role: true,
            });
            const savedLeaderRole = await manager.save(leaderRole);

            const memberRole = manager.create(ClanRole, {
                clan_id: newClan.id,
                name: 'Member',
                color: '#AAAAAA',
                power_level: 10,
                permissions: {
                    clanPermissions: {
                        canEditDetails: false, canEditAppearance: false, canEditRoles: false,
                        canEditApplicationForm: false, canAcceptMembers: false, canInviteMembers: false,
                        canUseClanTags: false, canAccessAdminChat: false,
                    },
                    memberPermissions: {
                        maxKickPower: 0, maxMutePower: 0, maxPromotePower: 0,
                        maxDemotePower: 0, maxWarnPower: 0,
                    }
                },
                is_system_role: true,
            });
            await manager.save(memberRole);

            const ownerMember = manager.create(ClanMember, {
                clan_id: newClan.id,
                user_id: ownerId,
                role_id: savedLeaderRole.id,
            });
            await manager.save(ownerMember);

            return newClan;
        });
    }


    async findAll(queryDto: FindAllClansDto): Promise<{ data: Clan[], total: number }> {
        const { page = 1, limit = 12, search } = queryDto;
        const queryBuilder = this.clansRepository.createQueryBuilder('clan');
        queryBuilder.leftJoinAndSelect('clan.owner', 'owner');
        queryBuilder.loadRelationCountAndMap('clan.member_count', 'clan.members');
        if (search) {
            queryBuilder.where('clan.name ILIKE :search OR clan.tag ILIKE :search', {
                search: `%${search}%`,
            });
        }
        queryBuilder.take(limit).skip((page - 1) * limit);
        queryBuilder.orderBy('clan.created_at', 'DESC');
        const [entities, total] = await queryBuilder.getManyAndCount();
        return {
            data: entities,
            total: total,
        };
    }


    async findOne(tag: string, viewerId?: number): Promise<any> {
        const clan = await this.clansRepository.findOne({
            where: { tag },
            relations: {
                owner: { rank: true },
                members: { user: { rank: true }, role: true },
                roles: true,
            },
        });

        if (!clan) {
            throw new NotFoundException(`Clan with tag @${tag} not found.`);
        }

        if (clan.members) {
            clan.members.sort((a, b) => (b.role?.power_level || 0) - (a.role?.power_level || 0));
        }

        let viewerHasMembershipHistory = false;
        if (viewerId) {
            const historyEntry = await this.dataSource.getRepository(ClanMemberHistory).findOneBy({
                clan_id: clan.id,
                user_id: viewerId,
            });
            if (historyEntry) {
                viewerHasMembershipHistory = true;
            }
        }

        return { ...clan, viewerHasMembershipHistory };
    }


    async getManagementData(tag: string, userId: number): Promise<any> {
        const clan = await this.findOne(tag);
        if (!clan) {
            throw new NotFoundException('Clan not found.');
        }

        const canManageAnything =
            await this.checkPermission(clan.id, userId, 'canEditDetails') ||
            await this.checkPermission(clan.id, userId, 'canEditRoles') ||
            await this.checkPermission(clan.id, userId, 'canAcceptMembers');

        if (!canManageAnything) {
            throw new ForbiddenException('You do not have permission to manage this clan.');
        }

        const [applications, warnings, invitations] = await Promise.all([
            this.dataSource.getRepository(ClanApplication).find({
                where: { clan_id: clan.id, status: ApplicationStatus.PENDING },
                relations: ['user', 'user.rank'],
                order: { created_at: 'ASC' },
            }),
            this.getClanWarnings(clan.id, userId).catch(() => []),            this.getSentInvitations(clan.id, userId).catch(() => []),        ]);

        return { clan, applications, warnings, invitations };
    }



    async joinOpenClan(clanId: number, userId: number): Promise<ClanMember> {
        const user = await this.usersRepository.findOneBy({ id: userId });
        if (!user || !user.minecraft_uuid) {
            throw new ForbiddenException('You must have a linked Minecraft account to join a clan.');
        }
        const clan = await this.clansRepository.findOneBy({ id: clanId });
        if (!clan) {
            throw new NotFoundException('Clan not found.');
        }
        if (clan.join_type !== ClanJoinType.OPEN) {
            throw new ForbiddenException('This clan is not open for everyone to join.');
        }
        const existingMembership = await this.dataSource.getRepository(ClanMember).findOneBy({ clan_id: clanId, user_id: userId });
        if (existingMembership) {
            throw new ConflictException('You are already a member of this clan.');
        }

        return this.dataSource.transaction(async (manager) => {
            const memberRole = await manager.findOneBy(ClanRole, { clan_id: clanId, name: 'Member' });
            if (!memberRole) throw new Error('Default "Member" role not found for this clan.');

            const newMember = manager.create(ClanMember, { clan_id: clanId, user_id: userId, role_id: memberRole.id });
            const savedMember = await manager.save(newMember);

            const historyEntry = manager.create(ClanMemberHistory, { clan_id: clanId, user_id: userId });
            await manager.save(historyEntry);

            return savedMember;
        });
    }

    async leaveClan(clanId: number, userId: number): Promise<void> {
        const clan = await this.clansRepository.findOneBy({ id: clanId });
        if (!clan) {
            throw new NotFoundException('Clan not found.');
        }
        if (clan.owner_id === userId) {
            throw new ForbiddenException('The clan owner cannot leave the clan. You must delete or transfer ownership.');
        }
        const membership = await this.dataSource.getRepository(ClanMember).findOneBy({ clan_id: clanId, user_id: userId });
        if (!membership) {
            throw new NotFoundException('You are not a member of this clan.');
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.update(ClanMemberHistory, { clan_id: clanId, user_id: userId, left_at: null }, { left_at: new Date() });
            await manager.remove(membership);
        });
    }

    async applyToClan(clanId: number, userId: number, dto: ApplyToClanDto): Promise<ClanApplication> {
        const user = await this.usersRepository.findOneBy({ id: userId });
        if (!user || !user.minecraft_uuid) {
            throw new ForbiddenException('You must have a linked Minecraft account to apply to a clan.');
        }
        const clan = await this.clansRepository.findOneBy({ id: clanId });
        if (!clan) {
            throw new NotFoundException('Clan not found.');
        }
        if (clan.join_type !== ClanJoinType.APPLICATION) {
            throw new ForbiddenException('This clan does not accept applications.');
        }
        const existingMembership = await this.dataSource.getRepository(ClanMember).findOneBy({ clan_id: clanId, user_id: userId });
        if (existingMembership) {
            throw new ConflictException('You are already a member of this clan.');
        }
        const existingApplication = await this.dataSource.getRepository(ClanApplication).findOneBy({
            clan_id: clanId,
            user_id: userId,
            status: ApplicationStatus.PENDING
        });
        const application = this.dataSource.getRepository(ClanApplication).create({
            clan_id: clanId,
            user_id: userId,
            answers: dto.answers,
        });
        if (existingApplication) {
            throw new ConflictException('You have already sent an application to this clan.');
        }
        return this.dataSource.getRepository(ClanApplication).save(application);
    }

    private async checkPermission(clanId: number, userId: number, permission: ClanPermissionKey): Promise<boolean> {
        const membership = await this.dataSource.getRepository(ClanMember).findOne({
            where: { clan_id: clanId, user_id: userId },
            relations: ['role'],
        });

        if (membership?.role?.permissions?.clanPermissions?.[permission]) {
            return true;
        }

        const clan = await this.clansRepository.findOneBy({ id: clanId });
        if (clan?.owner_id === userId) {
            return true;
        }

        return false;
    }

    async handleApplication(applicationId: number, managerId: number, dto: HandleApplicationDto): Promise<void> {
        const application = await this.dataSource.getRepository(ClanApplication).findOne({
            where: { id: applicationId }, relations: ['clan', 'user'],
        });
        if (!application || application.status !== ApplicationStatus.PENDING) {
            throw new NotFoundException('Pending application not found.');
        }

        const hasPermission = await this.checkPermission(application.clan_id, managerId, 'canAcceptMembers');
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to manage applications.');
        }

        this.eventEmitter.emit('clan.application.handled', {
            applicant: application.user,
            clan: application.clan,
            status: dto.status
        });

        return this.dataSource.transaction(async (manager) => {
            if (dto.status === ApplicationStatus.ACCEPTED) {
                const memberRole = await manager.findOneBy(ClanRole, { clan_id: application.clan_id, is_system_role: true, power_level: 10 });
                if (!memberRole) throw new Error('Default "Member" role not found.');
                const newMember = manager.create(ClanMember, { clan_id: application.clan_id, user_id: application.user_id, role_id: memberRole.id });
                await manager.save(newMember);

                const historyEntry = manager.create(ClanMemberHistory, { clan_id: application.clan_id, user_id: application.user_id });
                await manager.save(historyEntry);
            }
            application.status = dto.status;
            await manager.save(application);
        });
    }

    async updateClanDetails(tag: string, userId: number, dto: UpdateClanDto): Promise<Clan> {
        const clan = await this.clansRepository.findOneBy({ tag });
        if (!clan) {
            throw new NotFoundException('Clan not found.');
        }

        const hasPermission = await this.checkPermission(clan.id, userId, 'canEditDetails');
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to edit clan details.');
        }

        if (dto.card_color || dto.card_icon_url || dto.card_image_url || dto.text_color) {
            const canEditAppearance = await this.checkPermission(clan.id, userId, 'canEditAppearance');
            if (!canEditAppearance) {
                throw new ForbiddenException('You do not have permission to edit clan appearance.');
            }
        }

        Object.assign(clan, dto);
        return this.clansRepository.save(clan);
    }

    async createRole(clanId: number, userId: number, dto: CreateClanRoleDto): Promise<ClanRole> {
        const hasPermission = await this.checkPermission(clanId, userId, 'canEditRoles');
        if (dto.power_level >= 1000) {
            throw new ForbiddenException('Power level cannot be 1000 or greater for custom roles.');
        }

        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to manage roles in this clan.');
        }
        const existingRole = await this.dataSource.getRepository(ClanRole).findOneBy({ clan_id: clanId, name: ILike(dto.name), });
        if (existingRole) { throw new ConflictException(`A role with the name "${dto.name}" already exists in this clan.`); }
        const roleToCreate = this.dataSource.getRepository(ClanRole).create({
            name: dto.name, color: dto.color, power_level: dto.power_level, clan_id: clanId, is_system_role: false,
            permissions: { clanPermissions: dto.clanPermissions, memberPermissions: dto.memberPermissions, },
        });
        return this.dataSource.getRepository(ClanRole).save(roleToCreate);
    }

    async updateRole(clanId: number, roleId: number, userId: number, dto: UpdateClanRoleDto): Promise<ClanRole> {
        const hasPermission = await this.checkPermission(clanId, userId, 'canEditRoles');
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to manage roles in this clan.');
        }
        const role = await this.dataSource.getRepository(ClanRole).findOneBy({ id: roleId, clan_id: clanId });
        if (!role) { throw new NotFoundException(`Role with ID ${roleId} not found in this clan.`); }

        if (role.is_system_role) {
            const clan = await this.clansRepository.findOneBy({ id: clanId });
            if (!clan) {
                throw new NotFoundException(`Clan with ID ${clanId} not found.`);
            }
            if (clan.owner_id !== userId) {
                throw new ForbiddenException('Only the clan owner can edit system roles.');
            }
        }

        if (role.is_system_role) {
            const safeUpdateDto: { name?: string; color?: string } = {};
            if (dto.name) safeUpdateDto.name = dto.name;
            if (dto.color) safeUpdateDto.color = dto.color;
            Object.assign(role, safeUpdateDto);
        } else {
            if (dto.power_level && dto.power_level >= 1000) {
                throw new ForbiddenException('Power level cannot be 1000 or greater.');
            }
            if (dto.clanPermissions) { Object.assign(role.permissions.clanPermissions, dto.clanPermissions); }
            if (dto.memberPermissions) { Object.assign(role.permissions.memberPermissions, dto.memberPermissions); }
            if (dto.name) role.name = dto.name;
            if (dto.color) role.color = dto.color;
            if (dto.power_level) role.power_level = dto.power_level;
        }
        return this.dataSource.getRepository(ClanRole).save(role);
    }

    async deleteRole(clanId: number, roleId: number, userId: number): Promise<void> {
        const hasPermission = await this.checkPermission(clanId, userId, 'canEditRoles');
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to manage roles in this clan.');
        }
        const role = await this.dataSource.getRepository(ClanRole).findOneBy({ id: roleId, clan_id: clanId });
        if (!role) throw new NotFoundException(`Role with ID ${roleId} not found in this clan.`);
        if (role.is_system_role) throw new ForbiddenException('System roles cannot be deleted.');
        await this.dataSource.getRepository(ClanRole).remove(role);
    }

    async kickMember(clanId: number, actorId: number, targetMemberId: number, reason?: string): Promise<void> {
        const [actor, target] = await Promise.all([
            this.dataSource.getRepository(ClanMember).findOne({ where: { clan_id: clanId, user_id: actorId }, relations: ['role', 'user'] }),
            this.dataSource.getRepository(ClanMember).findOne({ where: { id: targetMemberId, clan_id: clanId }, relations: ['role', 'clan', 'user'] })
        ]);

        if (!actor) {
            throw new ForbiddenException('You are not a member of this clan.');
        }
        if (!target) {
            throw new NotFoundException('Target member not found in this clan.');
        }
        if (!actor.role || !target.role || !actor.user || !target.user) {
            throw new ForbiddenException('Cannot perform action: one of the members has an invalid role or user data.');
        }
        if (actor.id === target.id) {
            throw new ForbiddenException('You cannot kick yourself.');
        }
        if (target.user_id === target.clan.owner_id) {
            throw new ForbiddenException('The clan owner cannot be kicked.');
        }

        const actorPermissions = actor.role.permissions.memberPermissions;
        const actorPower = actor.role.power_level;
        const targetPower = target.role.power_level;

        if (actorPower <= targetPower) {
            throw new ForbiddenException('You cannot kick members with equal or higher power level.');
        }
        if (targetPower > actorPermissions.maxKickPower) {
            throw new ForbiddenException('Your role does not permit you to kick a member of this rank.');
        }

        this.eventEmitter.emit('clan.member.kicked', {
            kickedUser: target.user,
            actor: actor.user,
            clan: target.clan,
            reason: reason || 'No reason provided.'
        });

        await this.dataSource.transaction(async (manager) => {
            await manager.update(ClanMemberHistory, { clan_id: clanId, user_id: target.user_id, left_at: null }, { left_at: new Date() });
            await manager.remove(target);
        });
    }

    async getClanMessages(clanId: number, userId: number): Promise<ClanMessage[]> {
        const membership = await this.dataSource.getRepository(ClanMember).findOne({
            where: { clan_id: clanId, user_id: userId },
            relations: ['role'],
        });
        if (!membership) {
            throw new ForbiddenException('You are not a member of this clan.');
        }

        const canAccessAdminChat = membership.role?.permissions?.clanPermissions?.canAccessAdminChat || false;
        const whereConditions = [{ clan_id: clanId, channel: ClanChatChannel.GENERAL }];
        if (canAccessAdminChat) {
            whereConditions.push({ clan_id: clanId, channel: ClanChatChannel.ADMIN });
        }

        return this.dataSource.getRepository(ClanMessage).find({
            where: whereConditions,
            relations: ['author', 'author.rank', 'parent', 'parent.author'],
            order: { created_at: 'ASC' },
            take: 100,
        });
    }

    async createClanMessage(clanId: number, authorId: number, content: string, channel: ClanChatChannel, parentId?: number): Promise<ClanMessage> {
        const membership = await this.dataSource.getRepository(ClanMember).findOne({
            where: { clan_id: clanId, user_id: authorId },
            relations: ['role'],
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this clan.');
        }

        if (membership.is_muted) {
            if (membership.mute_expires_at && membership.mute_expires_at < new Date()) {
                membership.is_muted = false;
                membership.mute_expires_at = null;
                await this.dataSource.getRepository(ClanMember).save(membership);
            } else {
                throw new ForbiddenException('You are currently muted in this clan chat.');
            }
        }

        if (channel === ClanChatChannel.ADMIN) {
            const canAccessAdminChat = membership.role?.permissions?.clanPermissions?.canAccessAdminChat || false;
            if (!canAccessAdminChat) {
                throw new ForbiddenException('You do not have permission to post in the admin channel.');
            }
        }

        const message = this.dataSource.getRepository(ClanMessage).create({ clan_id: clanId, author_id: authorId, content, channel, parent_id: parentId });
        const savedMessage = await this.dataSource.getRepository(ClanMessage).save(message);
        return this.dataSource.getRepository(ClanMessage).findOneOrFail({
            where: { id: savedMessage.id },
            relations: ['author', 'author.rank', 'parent', 'parent.author'],
        });
    }

    async findMember(clanId: number, userId: number) {
        return this.dataSource.getRepository(ClanMember).findOne({
            where: { clan_id: clanId, user_id: userId },
            relations: ['role', 'clan', 'user'],
        });
    }

    async deleteClanMessage(clanId: number, actorId: number, messageId: number): Promise<ClanMessage> {
        const actorMembership = await this.dataSource.getRepository(ClanMember).findOne({
            where: { clan_id: clanId, user_id: actorId },
            relations: ['role'],
        });

        if (!actorMembership?.role) {
            throw new ForbiddenException('You are not a member of this clan or have an invalid role.');
        }

        const message = await this.dataSource.getRepository(ClanMessage).findOne({
            where: { id: messageId, clan_id: clanId },
            relations: ['author', 'author.rank'],
        });

        if (!message) {
            throw new NotFoundException('Message not found.');
        }

        const isAuthor = message.author_id === actorId;
        const canModerate = (message.author?.rank?.power_level || 0) < actorMembership.role.power_level;

        if (!isAuthor && !canModerate) {
            throw new ForbiddenException('You do not have permission to delete this message.');
        }

        message.content = '[deleted]';
        message.author_id = null;

        return this.dataSource.getRepository(ClanMessage).save(message);
    }

    async updateClanSettings(clanId: number, userId: number, dto: UpdateClanSettingsDto): Promise<Clan> {
        const hasPermission = await this.checkPermission(clanId, userId, 'canEditApplicationForm');
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to edit the application form.');
        }

        const clan = await this.clansRepository.findOneBy({ id: clanId });
        if (!clan) {
            throw new NotFoundException('Clan not found.');
        }

        clan.application_template = dto.application_template;
        return this.clansRepository.save(clan);
    }

    async changeMemberRole(clanId: number, actorId: number, targetMemberId: number, newRoleId: number): Promise<ClanMember> {
        this.logger.log(`[changeMemberRole] START: actorId=${actorId}, targetMemberId=${targetMemberId}, newRoleId=${newRoleId}`);

        const [actor, target, newRole] = await Promise.all([
            this.dataSource.getRepository(ClanMember).findOne({ where: { clan_id: clanId, user_id: actorId }, relations: ['role', 'user'] }),
            this.dataSource.getRepository(ClanMember).findOne({ where: { id: targetMemberId, clan_id: clanId }, relations: ['role', 'clan', 'user'] }),
            this.dataSource.getRepository(ClanRole).findOneBy({ id: newRoleId, clan_id: clanId })
        ]);

        if (!actor?.role) throw new ForbiddenException('You are not a member of this clan or have an invalid role.');
        if (!target?.role) throw new NotFoundException('Target member not found in this clan.');
        if (!newRole) throw new NotFoundException('The specified role does not exist in this clan.');

        this.logger.log(`[changeMemberRole] Entities found: actor=${actor.user.username}, target=${target.user.username}, newRole=${newRole.name}`);

        if (actor.id === target.id) throw new ForbiddenException('You cannot change your own role.');
        if (target.user_id === target.clan.owner_id) throw new ForbiddenException('You cannot change the role of the clan owner.');
        if (newRole.is_system_role && newRole.power_level === 1000) throw new ForbiddenException('The Leader role cannot be assigned manually.');
        const actorPower = actor.role.power_level;
        const targetPower = target.role.power_level;
        const newRolePower = newRole.power_level;

        if (actorPower <= targetPower) {
            throw new ForbiddenException('You cannot manage members with a power level equal to or higher than your own.');
        }
        if (newRolePower > actorPower) {
            throw new ForbiddenException('You cannot assign a role with a power level higher than your own.');
        }

        const isPromoting = newRolePower > targetPower;
        const actorPermissions = actor.role.permissions.memberPermissions;

        if (isPromoting && targetPower > actorPermissions.maxPromotePower) {
            this.logger.warn(`[changeMemberRole] FAILED CHECK: Promotion violation. Target Power (${targetPower}) > Actor Max Promote Power (${actorPermissions.maxPromotePower})`);
            throw new ForbiddenException('Your role does not permit you to promote a member of this rank.');
        }

        if (!isPromoting && targetPower > actorPermissions.maxDemotePower) {
            this.logger.warn(`[changeMemberRole] FAILED CHECK: Demotion violation. Target Power (${targetPower}) > Actor Max Demote Power (${actorPermissions.maxDemotePower})`);
            throw new ForbiddenException('Your role does not permit you to demote a member of this rank.');
        }

        const oldRoleName = target.role.name;
        this.logger.log(`[changeMemberRole] SUCCESS: All permission checks passed. Updating target's role.`);
        target.role = newRole;
        const savedMember = await this.dataSource.getRepository(ClanMember).save(target);

        this.eventEmitter.emit('clan.member.roleChanged', {
            targetUser: target.user,
            actor: actor.user,
            clan: target.clan,
            oldRoleName: oldRoleName,
            newRoleName: newRole.name
        });

        this.logger.log(`[changeMemberRole] COMPLETE: Save operation finished. Member ID ${savedMember.id} now has role ID ${savedMember.role_id}`);
        return savedMember;
    }

    async inviteMember(clanId: number, actorId: number, dto: InviteMemberDto): Promise<ClanInvitation> {
        const hasPermission = await this.checkPermission(clanId, actorId, 'canInviteMembers');
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to invite members.');
        }

        const [clan, actor, targetUser] = await Promise.all([
            this.clansRepository.findOneBy({ id: clanId }),
            this.usersRepository.findOneBy({ id: actorId }),
            this.usersRepository.findOneBy({ id: dto.userId }),
        ]);

        if (!targetUser) {
            throw new NotFoundException(`User with ID "${dto.userId}" not found.`);
        }

        if (targetUser.id === actorId) {
            throw new ForbiddenException('You cannot invite yourself.');
        }

        const existingMembership = await this.dataSource.getRepository(ClanMember).findOneBy({ user_id: targetUser.id });
        if (existingMembership) {
            throw new ConflictException(`User "${targetUser.username}" is already in a clan.`);
        }

        const existingInvite = await this.dataSource.getRepository(ClanInvitation).findOneBy({
            clan_id: clanId,
            invitee_id: targetUser.id,
            status: InvitationStatus.PENDING,
        });
        if (existingInvite) {
            throw new ConflictException(`An invitation for "${targetUser.username}" to this clan already exists.`);
        }

        const expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + 2);

        const invitation = this.dataSource.getRepository(ClanInvitation).create({
            clan_id: clanId,
            inviter_id: actorId,
            invitee_id: targetUser.id,
            expires_at,
        });

        this.eventEmitter.emit('clan.member.invited', {
            invitee: targetUser,
            inviter: actor,
            clan: clan
        });

        return this.dataSource.getRepository(ClanInvitation).save(invitation);
    }

    async getMyInvitations(userId: number): Promise<ClanInvitation[]> {
        return this.dataSource.getRepository(ClanInvitation).find({
            where: {
                invitee_id: userId,
                status: InvitationStatus.PENDING,
            },
            relations: ['clan', 'inviter'],
            order: { created_at: 'DESC' },
        });
    }

    async handleInvitation(invitationId: number, actorId: number, action: 'accept' | 'decline'): Promise<void> {
        const invitation = await this.dataSource.getRepository(ClanInvitation).findOneBy({
            id: invitationId,
            invitee_id: actorId,
            status: InvitationStatus.PENDING,
        });

        if (!invitation) {
            throw new NotFoundException('Pending invitation not found.');
        }

        if (new Date() > invitation.expires_at) {
            invitation.status = InvitationStatus.EXPIRED;
            await this.dataSource.getRepository(ClanInvitation).save(invitation);
            throw new ForbiddenException('This invitation has expired.');
        }

        if (action === 'accept') {
            const [actor, existingMembership] = await Promise.all([
                this.usersRepository.findOneBy({ id: actorId }),
                this.dataSource.getRepository(ClanMember).findOneBy({ user_id: actorId })
            ]);
            if (existingMembership) {
                throw new ConflictException('You are already in a clan. You must leave it before accepting a new invitation.');
            }

            if (!actor || !actor.minecraft_uuid) {
                throw new ForbiddenException('You must have a linked Minecraft account to accept a clan invitation.');
            }

            const memberRole = await this.dataSource.getRepository(ClanRole).findOneBy({ clan_id: invitation.clan_id, is_system_role: true, power_level: 10 });
            if (!memberRole) {
                throw new InternalServerErrorException('Default "Member" role not found for this clan.');
            }

            await this.dataSource.transaction(async (manager) => {
                const newMember = manager.create(ClanMember, {
                    clan_id: invitation.clan_id,
                    user_id: actorId,
                    role_id: memberRole.id,
                });
                await manager.save(newMember);

                const historyEntry = manager.create(ClanMemberHistory, { clan_id: invitation.clan_id, user_id: actorId });
                await manager.save(historyEntry);

                invitation.status = InvitationStatus.ACCEPTED;
                await manager.save(invitation);
            });
        } else {
            this.eventEmitter.emit('clan.invitation.declined', {
                decliner: await this.usersRepository.findOneBy({ id: actorId }),
                inviter: invitation.inviter
            });
            await this.dataSource.getRepository(ClanInvitation).delete(invitation.id);
        }
    }

    async warnMember(clanId: number, actorId: number, targetMemberId: number, dto: CreateClanWarningDto): Promise<ClanWarning> {
        const [actor, target] = await Promise.all([
            this.dataSource.getRepository(ClanMember).findOne({ where: { clan_id: clanId, user_id: actorId }, relations: ['role'] }),
            this.dataSource.getRepository(ClanMember).findOne({ where: { id: targetMemberId, clan_id: clanId }, relations: ['role', 'clan'] })
        ]);

        if (!actor?.role) throw new ForbiddenException('You are not a member of this clan or have an invalid role.');
        if (!target?.role) throw new NotFoundException('Target member not found in this clan.');

        if (actor.id === target.id) throw new ForbiddenException('You cannot warn yourself.');
        if (target.user_id === target.clan.owner_id) throw new ForbiddenException('You cannot warn the clan owner.');

        const actorPower = actor.role.power_level;
        const targetPower = target.role.power_level;
        const actorPermissions = actor.role.permissions.memberPermissions;

        if (actorPower <= targetPower) {
            throw new ForbiddenException('You cannot warn members with equal or higher power level.');
        }
        if (targetPower > actorPermissions.maxWarnPower) {
            throw new ForbiddenException('Your role does not permit you to warn a member of this rank.');
        }

        const warning = this.dataSource.getRepository(ClanWarning).create({
            clan_id: clanId,
            actor_id: actorId,
            target_id: target.user_id,
            reason: dto.reason,
        });

        return this.dataSource.getRepository(ClanWarning).save(warning);
    }

    async getClanWarnings(clanId: number, actorId: number): Promise<ClanWarning[]> {
        const actorMembership = await this.dataSource.getRepository(ClanMember).findOne({
            where: { clan_id: clanId, user_id: actorId },
            relations: ['role'],
        });

        if (!actorMembership?.role) {
            throw new ForbiddenException('You are not a member of this clan.');
        }

        if (actorMembership.role.permissions.memberPermissions.maxWarnPower <= 0) {
            throw new ForbiddenException('You do not have permission to view clan warnings.');
        }

        return this.dataSource.getRepository(ClanWarning).find({
            where: { clan_id: clanId },
            relations: ['actor', 'target'],
            order: { created_at: 'DESC' },
        });
    }

    async deleteClanWarning(clanId: number, actorId: number, warningId: number): Promise<void> {
        const actorMembership = await this.dataSource.getRepository(ClanMember).findOne({
            where: { clan_id: clanId, user_id: actorId },
            relations: ['role'],
        });

        if (!actorMembership?.role) {
            throw new ForbiddenException('You are not a member of this clan.');
        }

        const warning = await this.dataSource.getRepository(ClanWarning).findOne({
            where: { id: warningId, clan_id: clanId },
            relations: ['target'],
        });

        if (!warning) {
            throw new NotFoundException('Warning not found in this clan.');
        }

        const targetMembership = await this.dataSource.getRepository(ClanMember).findOne({
            where: { clan_id: clanId, user_id: warning.target_id },
            relations: ['role'],
        });

        const targetPower = targetMembership?.role?.power_level || 0;

        if (actorMembership.role.power_level <= targetPower || actorMembership.role.permissions.memberPermissions.maxWarnPower < targetPower) {
            throw new ForbiddenException('You do not have permission to remove warnings for this member.');
        }

        await this.dataSource.getRepository(ClanWarning).delete(warningId);
    }

    async getMyClanWarnings(userId: number): Promise<ClanWarning[]> {
        const membership = await this.dataSource.getRepository(ClanMember).findOneBy({ user_id: userId });

        if (!membership) {
            return [];
        }

        return this.dataSource.getRepository(ClanWarning).find({
            where: { target_id: userId, clan_id: membership.clan_id },
            relations: ['actor'],
            order: { created_at: 'DESC' },
        });
    }

    async getSentInvitations(clanId: number, actorId: number): Promise<ClanInvitation[]> {
        const hasPermission = await this.checkPermission(clanId, actorId, 'canInviteMembers');
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to view sent invitations.');
        }

        return this.dataSource.getRepository(ClanInvitation).find({
            where: {
                clan_id: clanId,
                status: InvitationStatus.PENDING,
            },
            relations: ['inviter', 'invitee'],
            order: { created_at: 'DESC' },
        });
    }

    async cancelInvitation(clanId: number, invitationId: number, actorId: number): Promise<void> {
        const hasPermission = await this.checkPermission(clanId, actorId, 'canInviteMembers');
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to cancel invitations.');
        }

        const invitation = await this.dataSource.getRepository(ClanInvitation).findOne({
            where: { id: invitationId, clan_id: clanId, status: InvitationStatus.PENDING },
            relations: ['inviter', 'invitee']
        });

        if (!invitation) {
            throw new NotFoundException('Pending invitation not found.');
        }

        await this.dataSource.getRepository(ClanInvitation).remove(invitation);

        this.eventEmitter.emit('clan.invitation.cancelled', {
            invitee: invitation.invitee,
            inviter: invitation.inviter
        });
    }

    async createClanReview(clanId: number, authorId: number, dto: CreateClanReviewDto): Promise<ClanReview> {
        const historyEntry = await this.dataSource.getRepository(ClanMemberHistory).findOneBy({
            clan_id: clanId,
            user_id: authorId
        });

        if (!historyEntry) {
            throw new ForbiddenException('Only current or former clan members can leave a review.');
        }

        const existingReview = await this.dataSource.getRepository(ClanReview).findOneBy({ clan_id: clanId, author_id: authorId });
        if (existingReview) {
            throw new ConflictException('You have already left a review for this clan.');
        }

        const review = this.dataSource.getRepository(ClanReview).create({ ...dto, clan_id: clanId, author_id: authorId, });
        return this.dataSource.getRepository(ClanReview).save(review);
    }

    async getClanReviews(clanId: number): Promise<ClanReview[]> {
        return this.dataSource.getRepository(ClanReview).find({
            where: { clan_id: clanId },
            relations: ['author', 'author.rank'],
            order: { created_at: 'DESC' },
        });
    }

    async muteMember(clanId: number, actorId: number, targetMemberId: number, dto: MuteClanMemberDto): Promise<ClanMember> {
        const [actor, target] = await Promise.all([
            this.dataSource.getRepository(ClanMember).findOne({ where: { clan_id: clanId, user_id: actorId }, relations: ['role'] }),
            this.dataSource.getRepository(ClanMember).findOne({ where: { id: targetMemberId, clan_id: clanId }, relations: ['role', 'clan'] })
        ]);

        if (!actor?.role) throw new ForbiddenException('You are not a member of this clan or have an invalid role.');
        if (!target?.role) throw new NotFoundException('Target member not found in this clan.');
        if (actor.id === target.id) throw new ForbiddenException('You cannot mute yourself.');
        if (target.user_id === target.clan.owner_id) throw new ForbiddenException('You cannot mute the clan owner.');

        const actorPower = actor.role.power_level;
        const targetPower = target.role.power_level;
        const actorPermissions = actor.role.permissions.memberPermissions;

        if (actorPower <= targetPower) {
            throw new ForbiddenException('You cannot mute members with equal or higher power level.');
        }
        if (targetPower > actorPermissions.maxMutePower) {
            throw new ForbiddenException('Your role does not permit you to mute a member of this rank.');
        }

        target.is_muted = true;
        if (dto.duration_minutes) {
            const expires = new Date();
            expires.setMinutes(expires.getMinutes() + dto.duration_minutes);
            target.mute_expires_at = expires;
        } else {
            target.mute_expires_at = null;
        }

        return this.dataSource.getRepository(ClanMember).save(target);
    }

    async unmuteMember(clanId: number, actorId: number, targetMemberId: number): Promise<ClanMember> {
        const [actor, target] = await Promise.all([
            this.dataSource.getRepository(ClanMember).findOne({ where: { clan_id: clanId, user_id: actorId }, relations: ['role'] }),
            this.dataSource.getRepository(ClanMember).findOne({ where: { id: targetMemberId, clan_id: clanId }, relations: ['role', 'clan'] })
        ]);

        if (!actor?.role) throw new ForbiddenException('You are not a member of this clan or have an invalid role.');
        if (!target) throw new NotFoundException('Target member not found in this clan.');
        if (actor.role.power_level <= (target.role?.power_level || 0)) {
            throw new ForbiddenException('You cannot unmute members with equal or higher power level.');
        }

        target.is_muted = false;
        target.mute_expires_at = null;

        return this.dataSource.getRepository(ClanMember).save(target);
    }

    private async getActorAndTargetFromReply(clanId: number, actorId: number, parentMessageId: number) {
        const parentMessage = await this.dataSource.getRepository(ClanMessage).findOneBy({ id: parentMessageId, clan_id: clanId });
        if (!parentMessage || !parentMessage.author_id) {
            throw new NotFoundException('Original message not found or author is unknown.');
        }

        const targetId = parentMessage.author_id;

        const [actor, target] = await Promise.all([
            this.findMember(clanId, actorId),
            this.findMember(clanId, targetId),
        ]);

        if (!actor || !target) {
            throw new NotFoundException('Could not find the acting member or the target member in this clan.');
        }

        if (!actor.role || !target.role) {
            throw new ForbiddenException('Action cannot be performed because a member has an invalid or missing role.');
        }

        if (actorId === targetId) throw new ForbiddenException('You cannot perform this action on yourself.');

        if (target.clan.owner_id === targetId) throw new ForbiddenException('You cannot perform this action on the clan owner.');

        return { actor, target };
    }

    async kickMemberByChat(clanId: number, actorId: number, parentMessageId: number, reason: string): Promise<string> {
        const { actor, target } = await this.getActorAndTargetFromReply(clanId, actorId, parentMessageId);

        if (!actor.role || !target.role) {
            throw new ForbiddenException('Action cannot be performed because a member has an invalid or missing role.');
        }

        if (actor.role.power_level <= target.role.power_level || target.role.power_level > actor.role.permissions.memberPermissions.maxKickPower) {
            throw new ForbiddenException('You do not have permission to kick this member.');
        }

        await this.kickMember(clanId, actorId, target.id);
        return `Successfully kicked ${target.user.username}. Reason: ${reason || 'Not specified'}`;
    }

    async muteMemberByChat(clanId: number, actorId: number, parentMessageId: number, args: string[]): Promise<string> {
        const { actor, target } = await this.getActorAndTargetFromReply(clanId, actorId, parentMessageId);

        if (!actor.role || !target.role) {
            throw new ForbiddenException('Action cannot be performed because a member has an invalid or missing role.');
        }

        if (actor.role.power_level <= target.role.power_level || target.role.power_level > actor.role.permissions.memberPermissions.maxMutePower) {
            throw new ForbiddenException('You do not have permission to mute this member.');
        }

        const duration_minutes = parseInt(args[0], 10);
        const reason = isNaN(duration_minutes) ? args.join(' ') : args.slice(1).join(' ');
        if (!reason) throw new Error('Mute reason is required. Usage: /mute [duration_minutes] <reason>');
        const dto: MuteClanMemberDto = { reason, duration_minutes: isNaN(duration_minutes) ? undefined : duration_minutes };

        await this.muteMember(clanId, actorId, target.id, dto);
        const durationText = dto.duration_minutes ? ` for ${dto.duration_minutes} minutes` : ' permanently';
        return `Successfully muted ${target.user.username}${durationText}.`;
    }

    async unmuteMemberByChat(clanId: number, actorId: number, parentMessageId: number): Promise<string> {
        const { actor, target } = await this.getActorAndTargetFromReply(clanId, actorId, parentMessageId);

        if (!actor.role || !target.role) {
            throw new ForbiddenException('Action cannot be performed because a member has an invalid or missing role.');
        }

        if (actor.role.power_level <= target.role.power_level || target.role.power_level > actor.role.permissions.memberPermissions.maxMutePower) {
            throw new ForbiddenException('You do not have permission to unmute this member.');
        }

        await this.unmuteMember(clanId, actorId, target.id);
        return `Successfully unmuted ${target.user.username}.`;
    }

    async warnMemberByChat(clanId: number, actorId: number, parentMessageId: number, reason: string): Promise<string> {
        const { actor, target } = await this.getActorAndTargetFromReply(clanId, actorId, parentMessageId);

        if (!actor.role || !target.role) {
            throw new ForbiddenException('Action cannot be performed because a member has an invalid or missing role.');
        }

        if (actor.role.power_level <= target.role.power_level || target.role.power_level > actor.role.permissions.memberPermissions.maxWarnPower) {
            throw new ForbiddenException('You do not have permission to warn this member.');
        }

        if (!reason) throw new Error('Warning reason is required. Usage: /warn <reason>');
        await this.warnMember(clanId, actorId, target.id, { reason });
        return `Warning issued to ${target.user.username}.`;
    }

    async revokeMostRecentWarning(clanId: number, actorId: number, parentMessageId: number): Promise<string> {
        const { actor, target } = await this.getActorAndTargetFromReply(clanId, actorId, parentMessageId);

        if (!actor.role || !target.role) {
            throw new ForbiddenException('Action cannot be performed because a member has an invalid or missing role.');
        }

        const targetPower = target.role.power_level;
        if (actor.role.power_level <= targetPower || actor.role.permissions.memberPermissions.maxWarnPower < targetPower) {
            throw new ForbiddenException('You do not have permission to manage warnings for this member.');
        }

        const lastWarning = await this.dataSource.getRepository(ClanWarning).findOne({
            where: { clan_id: clanId, target_id: target.user_id },
            order: { created_at: 'DESC' },
        });

        if (!lastWarning) {
            throw new NotFoundException(`${target.user.username} has no active warnings.`);
        }

        await this.dataSource.getRepository(ClanWarning).delete(lastWarning.id);
        return `The most recent warning for ${target.user.username} has been revoked.`;
    }

    async changeRoleByChat(clanId: number, actorId: number, parentMessageId: number, args: string[]): Promise<string> {
        const { target } = await this.getActorAndTargetFromReply(clanId, actorId, parentMessageId);

        if (!target.role) {
            throw new ForbiddenException('Target member has an invalid or missing role.');
        }

        const allRoles = await this.dataSource.getRepository(ClanRole).find({ where: { clan_id: clanId }, order: { power_level: 'ASC' } });
        const direction = args[0]?.toLowerCase();
        let newRoleId: number;

        if (direction === 'up' || direction === 'down') {
            const step = args[1] ? parseInt(args[1], 10) : 1;
            if (isNaN(step) || step < 1) throw new Error('Step must be a positive number.');

            const currentRoleIndex = allRoles.findIndex(r => r.id === target.role_id);
            if (currentRoleIndex === -1) throw new InternalServerErrorException('Could not find current role index.');

            const newIndex = direction === 'up' ? currentRoleIndex + step : currentRoleIndex - step;
            if (newIndex < 0 || newIndex >= allRoles.length) throw new Error('Cannot change role beyond the existing range.');

            newRoleId = allRoles[newIndex].id;
        } else {
            const roleName = args.join(' ');
            const foundRole = allRoles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            if (!foundRole) throw new NotFoundException(`Role "${roleName}" not found in this clan.`);
            newRoleId = foundRole.id;
        }

        await this.changeMemberRole(clanId, actorId, target.id, newRoleId);
        const newRole = allRoles.find(r => r.id === newRoleId);

        if (!newRole) {
            throw new InternalServerErrorException('Could not find the new role after processing.');
        }
        return `${target.user.username}'s role has been changed to ${newRole.name}.`;
    }

    async transferOwnership(tag: string, currentOwnerId: number, dto: TransferOwnershipDto): Promise<void> {
        const { newOwnerId, oldOwnerNewRoleId } = dto;

        if (currentOwnerId === newOwnerId) {
            throw new ForbiddenException('You cannot transfer ownership to yourself.');
        }

        return this.dataSource.transaction(async (manager) => {
            const clan = await manager.findOneBy(Clan, { tag });
            if (!clan) throw new NotFoundException(`Clan with tag @${tag} not found.`);
            if (clan.owner_id !== currentOwnerId) throw new ForbiddenException('Only the current clan owner can transfer ownership.');

            const newOwnerMember = await manager.findOneBy(ClanMember, { user_id: newOwnerId, clan_id: clan.id });
            if (!newOwnerMember) throw new NotFoundException('The selected user is not a member of this clan.');

            const oldOwnerNewRole = await manager.findOneBy(ClanRole, { id: oldOwnerNewRoleId, clan_id: clan.id });
            if (!oldOwnerNewRole || oldOwnerNewRole.power_level >= 1000) {
                throw new ForbiddenException('The selected role for the old owner is invalid or is a Leader role.');
            }

            const leaderRole = await manager.findOneBy(ClanRole, { clan_id: clan.id, power_level: 1000 });
            if (!leaderRole) throw new InternalServerErrorException('System role "Leader" not found for this clan.');

            const oldOwnerMember = await manager.findOneBy(ClanMember, { user_id: currentOwnerId, clan_id: clan.id });
            if (!oldOwnerMember) throw new InternalServerErrorException('Could not find the membership entry for the current owner.');


            oldOwnerMember.role_id = oldOwnerNewRoleId;
            await manager.save(oldOwnerMember);


            newOwnerMember.role_id = leaderRole.id;
            await manager.save(newOwnerMember);


            clan.owner_id = newOwnerId;
            await manager.save(clan);

            const newOwnerUser = await manager.findOneBy(User, { id: newOwnerId });
            const oldOwnerUser = await manager.findOneBy(User, { id: currentOwnerId });

            this.eventEmitter.emit('clan.ownership.transferred', {
                clanName: clan.name,
                newOwner: newOwnerUser,
                oldOwner: oldOwnerUser
            });

            this.logger.warn(`[OWNERSHIP-TRANSFER] 👑 Clan '${clan.name}' (ID: ${clan.id}) ownership transferred from User ID ${currentOwnerId} to ${newOwnerId}.`);
        });
    }

    async deleteClan(tag: string, actorId: number): Promise<void> {
        return this.dataSource.transaction(async (manager) => {
            const clan = await manager.findOne(Clan, {
                where: { tag },
                relations: ['members', 'members.user'],
            });

            if (!clan) {
                throw new NotFoundException(`Clan with tag @${tag} not found.`);
            }

            if (clan.owner_id !== actorId) {
                throw new ForbiddenException('Only the clan owner can delete the clan.');
            }

            for (const member of clan.members) {
                if (member.user_id !== actorId) {
                    this.eventEmitter.emit('clan.deleted', {
                        member: member.user,
                        clanName: clan.name,
                        ownerName: clan.owner.username,
                    });
                }
            }

            await manager.remove(clan);

            this.logger.warn(`[CLAN-DELETE] 🚮 Clan "${clan.name}" (ID: ${clan.id}) was deleted by owner ID ${actorId}.`);
        });
    }

    async editClanMessage(clanId: number, actorId: number, messageId: number, newContent: string): Promise<ClanMessage> {
        const message = await this.dataSource.getRepository(ClanMessage).findOne({
            where: { id: messageId, clan_id: clanId },
            relations: ['author'],
        });

        if (!message) {
            throw new NotFoundException('Message not found.');
        }

        if (message.author_id !== actorId) {
            throw new ForbiddenException('You can only edit your own messages.');
        }

        const timeSinceCreation = new Date().getTime() - new Date(message.created_at).getTime();
        const tenMinutes = 10 * 60 * 1000;
        if (timeSinceCreation > tenMinutes) {
            throw new ForbiddenException('You can no longer edit this message.');
        }

        message.content = newContent;
        return this.dataSource.getRepository(ClanMessage).save(message);
    }
}

