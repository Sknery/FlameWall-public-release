import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { User } from '../users/entities/user.entity';
import { PendingCommand } from '../shop/entities/pending-command.entity';
import { PluginApiKeyGuard } from '../auth/guards/plugin-api-key.guard';
import { UsersModule } from 'src/users/users.module';
import { Comment } from '../comments/entities/comment.entity';
import { AchievementsModule } from 'src/achievements/achievements.module';
import { ServerGroup } from 'src/achievements/entities/server-group.entity';
import { Achievement } from '../achievements/entities/achievement.entity';
import { AchievementProgress } from '../achievements/entities/achievement-progress.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Achievement,
      AchievementProgress,
      User,
      PendingCommand,
      Comment,
      ServerGroup
    ]),
    UsersModule,
    AchievementsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, PluginApiKeyGuard],
  exports: [EventsService],
})
export class EventsModule { }
