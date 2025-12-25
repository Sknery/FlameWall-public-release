import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClansController } from './clans.controller';
import { ClansService } from './clans.service';
import { Clan } from './entities/clan.entity';
import { ClanMember } from './entities/clan-member.entity';
import { ClanRole } from './entities/clan-role.entity';
import { ClanApplication } from './entities/clan-application.entity';
import { ClanReview } from './entities/clan-review.entity';
import { User } from '../users/entities/user.entity';
import { ClanRolesController } from './clan-roles.controller';
import { ClanMembersController } from './clan-members.controller';
import { ClanMessage } from './entities/clan-message.entity';
import { ClanMessagesController } from './clan-messages.controller';
import { ClanInvitationsController } from './clan-invitations.controller';
import { ClanInvitation } from './entities/clan-invitation.entity';
import { ClanWarning } from './entities/clan-warning.entity';
import { ClanReviewsController } from './clan-reviews.controller';
import { ClanMemberHistory } from './entities/clan-member-history.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Clan,
      ClanMember,
      ClanRole,
      ClanApplication,
      ClanReview,
      User,
      ClanMessage,
      ClanInvitation,
      ClanWarning,
      ClanMemberHistory
    ]),
    forwardRef(() => NotificationsModule)
  ],
  controllers: [
    ClansController,
    ClanInvitationsController,
    ClanMembersController,
    ClanMessagesController,
    ClanReviewsController,
    ClanRolesController,
  ],
  providers: [ClansService],
  exports: [ClansService]
})
export class ClansModule { }
