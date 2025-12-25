import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { WsGuard } from '../auth/guards/ws.guard';
import { FriendshipsModule } from '../friendships/friendships.module';
import { LinkingModule } from '../linking/linking.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalMessage } from './entities/global-message.entity';
import { GlobalChatService } from './global-chat.service';
import { ClansModule } from 'src/clans/clans.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([GlobalMessage]),
    MessagesModule,
    FriendshipsModule,
    LinkingModule,


    forwardRef(() => AchievementsModule),
    ClansModule,
  ],
  providers: [ChatGateway, WsGuard, GlobalChatService],

  exports: [ChatGateway],
})
export class ChatModule {}
