
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SeederService } from './seeder.service';
import { ClansModule } from '../clans/clans.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AchievementGroup } from '../achievements/entities/achievement-group.entity';
import { AchievementProgress } from '../achievements/entities/achievement-progress.entity';
import { Achievement } from '../achievements/entities/achievement.entity';
import { ServerGroup } from '../achievements/entities/server-group.entity';
import { BanReason } from '../admin/entities/ban-reason.entity';
import { GlobalMessage } from '../chat/entities/global-message.entity';
import { ClanApplication } from '../clans/entities/clan-application.entity';
import { ClanInvitation } from '../clans/entities/clan-invitation.entity';
import { ClanMemberHistory } from '../clans/entities/clan-member-history.entity';
import { ClanMember } from '../clans/entities/clan-member.entity';
import { ClanMessage } from '../clans/entities/clan-message.entity';
import { ClanReview } from '../clans/entities/clan-review.entity';
import { ClanRole } from '../clans/entities/clan-role.entity';
import { ClanWarning } from '../clans/entities/clan-warning.entity';
import { Clan } from '../clans/entities/clan.entity';
import { Comment } from '../comments/entities/comment.entity';
import { FriendshipRejection } from '../friendships/entities/friendship-rejection.entity';
import { Friendship } from '../friendships/entities/friendship.entity';
import { LinkCode } from '../linking/entities/link-code.entity';
import { Message } from '../messages/entities/message.entity';
import { News } from '../news/entities/news.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { PushSubscription } from '../notifications/entities/push-subscription.entity';
import { PageCategory } from '../pages/entities/page-category.entity';
import { CustomPage } from '../pages/entities/page.entity';
import { Post } from '../posts/entities/post.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Rank } from '../ranks/entities/rank.entity';
import { SiteSettings } from '../settings/entities/setting.entity';
import { PendingCommand } from '../shop/entities/pending-command.entity';
import { ShopItem } from '../shop/entities/shop-item.entity';
import { User } from '../users/entities/user.entity';
import { Vote } from '../votes/entities/vote.entity';
import { Tag } from '../tags/entities/tag.entity';


@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        EventEmitterModule.forRoot(),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST'),
                port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_DATABASE'),
                autoLoadEntities: true,
                synchronize: false,
            }),
        }),
        TypeOrmModule.forFeature([
            AchievementGroup, AchievementProgress, Achievement, ServerGroup, BanReason,
            GlobalMessage, ClanApplication, ClanInvitation, ClanMemberHistory,
            ClanMember, ClanMessage, ClanReview, ClanRole, ClanWarning, Clan,
            Comment, FriendshipRejection, Friendship, LinkCode, Message, News,
            Notification, PushSubscription, PageCategory, CustomPage, Post,
            Purchase, Rank, SiteSettings, PendingCommand, ShopItem, User, Vote,
            Tag,        ]),
        ClansModule,
    ],
    providers: [SeederService],
})
export class SeederModule { }

