import { Module, UploadedFile } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { User } from './users/entities/user.entity';
import { ShopItem } from './shop/entities/shop-item.entity';
import { Post } from './posts/entities/post.entity';
import { Friendship } from './friendships/entities/friendship.entity';
import { Message } from './messages/entities/message.entity';
import { News } from './news/entities/news.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Comment } from './comments/entities/comment.entity';
import { Purchase } from './purchases/entities/purchase.entity';

import { UsersModule } from './users/users.module';
import { ShopModule } from './shop/shop.module';
import { PostsModule } from './posts/posts.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { MessagesModule } from './messages/messages.module';
import { NewsModule } from './news/news.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentsModule } from './comments/comments.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ChatModule } from './chat/chat.module';
import { VotesModule } from './votes/votes.module';
import { LinkCode } from './linking/entities/link-code.entity';
import { RanksModule } from './ranks/ranks.module';
import { Rank } from './ranks/entities/rank.entity';
import { PagesModule } from './pages/pages.module';
import { CustomPage } from './pages/entities/page.entity';
import { UploadsModule } from './uploads/uploads.module';
import { AchievementsModule } from './achievements/achievements.module';
import { EventsModule } from './events/events.module';
import { Achievement } from './achievements/entities/achievement.entity';
import { AchievementProgress } from './achievements/entities/achievement-progress.entity';
import { ClansModule } from './clans/clans.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SettingsModule } from './settings/settings.module';
import { SiteSettings } from './settings/entities/setting.entity';
import { NavigationModule } from './navigation/navigation.module';
import { TagsModule } from './tags/tags.module';
import { Tag } from './tags/entities/tag.entity';
import { MailerModule } from './mailer/mailer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      global: true,
    }),
    TypeOrmModule.forRootAsync({
      name: 'default',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          User, ShopItem, Post, Friendship, Message, News, Notification, Comment, Purchase, LinkCode, Rank, CustomPage, Achievement, AchievementProgress, SiteSettings, Tag
        ],
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),
    MailerModule,
    UsersModule,
    AuthModule,
    AdminModule,
    ChatModule,
    ShopModule,
    PostsModule,
    FriendshipsModule,
    MessagesModule,
    NewsModule,
    NotificationsModule,
    CommentsModule,
    VotesModule,
    MessagesModule,
    RanksModule,
    PagesModule,
    UploadsModule,
    AchievementsModule,
    EventsModule,
    ClansModule,
    PurchasesModule,
    SettingsModule,
    NavigationModule,
    TagsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
