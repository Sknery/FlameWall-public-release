import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { Achievement } from './entities/achievement.entity';
import { AchievementProgress } from './entities/achievement-progress.entity';
import { AchievementGroup } from './entities/achievement-group.entity';
import { AchievementGroupsController } from './achievement-groups.controller';
import { AchievementGroupsService } from './achievement-groups.service';
import { ChatModule } from 'src/chat/chat.module';
import { ServerGroup } from './entities/server-group.entity';



@Module({
  imports: [
    TypeOrmModule.forFeature([Achievement, AchievementProgress, AchievementGroup, ServerGroup]),
    forwardRef(() => ChatModule),
  ],
  controllers: [AchievementsController, AchievementGroupsController],
  providers: [AchievementsService, AchievementGroupsService],
  exports: [AchievementsService]
})
export class AchievementsModule { }
