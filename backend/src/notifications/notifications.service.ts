
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApplicationStatus } from 'src/clans/entities/clan-application.entity';
import { Clan } from 'src/clans/entities/clan.entity';
import { PushNotificationsService } from './push-notifications.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private eventEmitter: EventEmitter2,
    private pushNotificationsService: PushNotificationsService,
  ) { }

  private async create(user: User, title: string, message: string, type: string, link: string | null = null): Promise<void> {
    try {
      const notification = this.notificationsRepository.create({
        user,
        title,
        message,
        type,
        link,
      });
      const savedNotification = await this.notificationsRepository.save(notification);

      this.logger.log(`[NOTIFY] Notification saved (ID: ${savedNotification.notification_id}). Triggering push notification...`);
      await this.pushNotificationsService.sendPushNotification(user.id, {
        title: title,
        body: message,
        url: link || '/',
      });

      const populatedNotification = await this.notificationsRepository.findOne({
        where: { notification_id: savedNotification.notification_id },
        relations: ['user']
      });

      this.logger.log(`[NOTIFY] Created notification (ID: ${savedNotification.notification_id}, Type: ${type}) for User ID: ${user.id}.`);
      this.eventEmitter.emit('notification.created', populatedNotification);

    } catch (error) {
      this.logger.error(`[NOTIFY] Failed to create notification for User ID: ${user.id}. Title: ${title}`, error.stack);
    }
  }

  @OnEvent('friendship.accepted', { async: true })
  async handleFriendshipAccepted(payload: { requester: User, receiver: User }) {
    const { requester, receiver } = payload;
    this.logger.verbose(`[EVENT] Received 'friendship.accepted' for requester ID: ${requester.id} and receiver ID: ${receiver.id}.`);
    const title = 'Friend Request Accepted';
    const message = `${receiver.username} is now your friend.`;
    const link = `/users/${receiver.profile_slug || receiver.id}`;
    await this.create(requester, title, message, 'friendship.accepted', link);
  }

  @OnEvent('friendship.requested', { async: true })
  async handleFriendshipRequested(payload: { requester: User, receiver: User }) {
    const { requester, receiver } = payload;
    this.logger.verbose(`[EVENT] Received 'friendship.requested' from User ID: ${requester.id} to User ID: ${receiver.id}.`);
    const title = 'New Friend Request';
    const message = `${requester.username} wants to be your friend.`;
    const link = `/friends`;
    await this.create(receiver, title, message, 'friendship.requested', link);
  }

  @OnEvent('message.sent', { async: true })
  async handleMessageSent(payload: { sender: User, recipient: User }) {
    const { sender, recipient } = payload;
    this.logger.verbose(`[EVENT] Received 'message.sent' from User ID: ${sender.id} to User ID: ${recipient.id}.`);
    const title = 'New Message';
    const message = `You have a new message from ${sender.username}.`;
    const link = `/messages/${sender.id}`;
    await this.create(recipient, title, message, 'message.sent', link);
  }

  async getForUser(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 30,
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<Notification> {
    const notification = await this.notificationsRepository.findOneBy({
      notification_id: notificationId,
      user_id: userId
    });
    if (!notification) {
      this.logger.warn(`[MARK-READ-FAIL] User ID: ${userId} failed to mark notification ID: ${notificationId} as read. Reason: Not found or no permission.`);
      throw new NotFoundException('Notification not found or you do not have permission to access it.');
    }
    notification.read = true;
    this.logger.log(`[MARK-READ-SUCCESS] Notification ID: ${notificationId} was marked as read by User ID: ${userId}.`);
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<{ affected?: number }> {
    const result = await this.notificationsRepository.update(
      { user_id: userId, read: false },
      { read: true },
    );
    this.logger.log(`[MARK-ALL-READ-SUCCESS] Marked ${result.affected || 0} notification(s) as read for User ID: ${userId}.`);
    return { affected: result.affected };
  }

  async markAsReadByLink(userId: number, link: string): Promise<{ affected?: number }> {
    const result = await this.notificationsRepository.update(
      { user_id: userId, link: link, read: false },
      { read: true },
    );
    this.logger.log(`[MARK-READ-LINK-SUCCESS] Marked ${result.affected || 0} notification(s) as read for User ID: ${userId} with link: ${link}.`);
    return { affected: result.affected };
  }

  @OnEvent('clan.application.handled', { async: true })
  async handleClanApplication({ applicant, clan, status }: { applicant: User, clan: Clan, status: ApplicationStatus }) {
    const title = `Your application to ${clan.name}`;
    const message = status === ApplicationStatus.ACCEPTED
      ? `has been accepted! Welcome to the clan.`
      : `has been declined.`;
    const link = `/clans/${clan.tag}`;
    await this.create(applicant, title, message, 'clan.application.handled', link);
  }

  @OnEvent('clan.member.invited', { async: true })
  async handleClanInvite({ invitee, inviter, clan }: { invitee: User, inviter: User, clan: Clan }) {
    const title = `You've been invited!`;
    const message = `${inviter.username} invited you to join the clan ${clan.name}.`;
    const link = `/friends`;
    await this.create(invitee, title, message, 'clan.member.invited', link);
  }

  @OnEvent('clan.member.kicked', { async: true })
  async handleClanKick({ kickedUser, actor, clan, reason }: { kickedUser: User, actor: User, clan: Clan, reason: string }) {
    const title = `You have been kicked from ${clan.name}`;
    const message = `You were kicked by ${actor.username}. Reason: ${reason}`;
    await this.create(kickedUser, title, message, 'clan.member.kicked');
  }

  @OnEvent('clan.member.roleChanged', { async: true })
  async handleRoleChange({ targetUser, actor, clan, oldRoleName, newRoleName }: { targetUser: User, actor: User, clan: Clan, oldRoleName: string, newRoleName: string }) {
    const title = `Your role in ${clan.name} was changed`;
    const message = `${actor.username} changed your role from "${oldRoleName}" to "${newRoleName}".`;
    const link = `/clans/${clan.tag}`;
    await this.create(targetUser, title, message, 'clan.member.roleChanged', link);
  }

  @OnEvent('clan.ownership.transferred', { async: true })
  async handleOwnershipTransfer({ clanName, newOwner, oldOwner }: { clanName: string, newOwner: User, oldOwner: User }) {
    await this.create(newOwner, `You are the new owner of ${clanName}`, `Ownership was transferred to you by ${oldOwner.username}.`, 'clan.ownership.received');
    await this.create(oldOwner, `Ownership of ${clanName} transferred`, `You have successfully transferred ownership to ${newOwner.username}.`, 'clan.ownership.given');
  }

  @OnEvent('clan.invitation.declined', { async: true })
  async handleInviteDeclined({ decliner, inviter }: { decliner: User, inviter: User }) {
    const title = "Invitation Declined";
    const message = `${decliner.username} declined your invitation to the clan.`;
    await this.create(inviter, title, message, 'clan.invitation.declined');
  }

  @OnEvent('clan.invitation.cancelled', { async: true })
  async handleInviteCancelled({ invitee, inviter }: { invitee: User, inviter: User }) {
    const title = "Invitation Cancelled";
    const message = `The invitation for ${invitee.username} was cancelled by another manager.`;
    await this.create(inviter, title, message, 'clan.invitation.cancelled');
  }

  @OnEvent('clan.deleted', { async: true })
  async handleClanDeleted({ member, clanName, ownerName }: { member: User, clanName: string, ownerName: string }) {
    const title = `Clan ${clanName} has been disbanded`;
    const message = `The clan owner, ${ownerName}, has permanently deleted the clan.`;
    await this.create(member, title, message, 'clan.deleted');
  }

  // Public method for creating notifications from other services
  async createNotification(user: User, title: string, message: string, type: string, link: string | null = null): Promise<void> {
    await this.create(user, title, message, type, link);
  }
}
