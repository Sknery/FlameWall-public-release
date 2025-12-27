import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { ClansModule } from 'src/clans/clans.module';
import { PushSubscription } from './entities/push-subscription.entity';
import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from './push-notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, PushSubscription]),
    forwardRef(() => ClansModule),
  ],
  controllers: [NotificationsController, PushNotificationsController],
  providers: [NotificationsService, PushNotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}