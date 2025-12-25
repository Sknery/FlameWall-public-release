import { Module, forwardRef } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { User } from '../users/entities/user.entity';
import { FriendshipsPluginController } from './friendships.plugin.controller';
import { PluginApiKeyGuard } from '../auth/guards/plugin-api-key.guard';
import { UsersModule } from '../users/users.module';
import { FriendshipRejection } from './entities/friendship-rejection.entity';
import { EventsModule } from 'src/events/events.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Friendship,
      User,
      FriendshipRejection
    ]),
    UsersModule,
    forwardRef(() => EventsModule)
  ],
  controllers: [FriendshipsController, FriendshipsPluginController],
  providers: [FriendshipsService, PluginApiKeyGuard],
  exports: [FriendshipsService],
})
export class FriendshipsModule { }
