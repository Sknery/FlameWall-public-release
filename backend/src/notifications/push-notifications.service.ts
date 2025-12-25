
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webPush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';

@Injectable()
export class PushNotificationsService implements OnModuleInit {
    private readonly logger = new Logger(PushNotificationsService.name);

    constructor(
        @InjectRepository(PushSubscription)
        private subscriptionRepository: Repository<PushSubscription>,
        private configService: ConfigService,
    ) {}

   onModuleInit() {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT');

    this.logger.log(`VAPID Public Key Loaded: ${!!publicKey}`);
    this.logger.log(`VAPID Private Key Loaded: ${!!privateKey}`);
    this.logger.log(`VAPID Subject Loaded: ${!!subject}`);

    if (!publicKey || !privateKey || !subject) {
        this.logger.error('VAPID keys are not configured in .env file!');
        return;
    }
    webPush.setVapidDetails(subject, publicKey, privateKey);
    this.logger.log('Web-push service configured with VAPID keys.');
}

    async subscribe(userId: number, subscriptionDto: any): Promise<PushSubscription> {
        const { endpoint, keys } = subscriptionDto;
        const newSubscription = this.subscriptionRepository.create({
            user_id: userId,
            endpoint: endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
        });
        return this.subscriptionRepository.save(newSubscription);
    }

    async sendPushNotification(userId: number, payload: { title: string; body: string; url: string }) {
        this.logger.log(`[PUSH] Attempting to send push notification to User ID: ${userId}`);

        const subscriptions = await this.subscriptionRepository.findBy({ user_id: userId });
        if (subscriptions.length === 0) {
            this.logger.warn(`[PUSH] No active push subscriptions found for User ID: ${userId}. Aborting.`);
            return;
        }

        this.logger.log(`[PUSH] Found ${subscriptions.length} subscription(s). Sending payload: ${JSON.stringify(payload)}`);

        const notificationPayload = JSON.stringify(payload);

        const sendPromises = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            };
            return webPush.sendNotification(pushSubscription, notificationPayload)
                .catch(error => {
                    if (error.statusCode === 410) {                        this.logger.warn(`[PUSH] Subscription for user ${userId} has expired. Deleting.`);
                        return this.subscriptionRepository.delete({ id: sub.id });
                    } else {
                        this.logger.error(`[PUSH] Error sending push notification: ${error.body}`);
                    }
                });
        });

        await Promise.all(sendPromises);
    }
}
