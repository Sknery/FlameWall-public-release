
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PushNotificationsService } from './push-notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PushNotificationsController {
    constructor(private readonly pushService: PushNotificationsService) {}

    @Post('subscribe')
    subscribe(@Request() req, @Body() subscriptionDto: any) {
        return this.pushService.subscribe(req.user.userId, subscriptionDto);
    }
}