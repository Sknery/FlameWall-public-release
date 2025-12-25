

import { Controller, Get, Param, ParseIntPipe, UseGuards, Post, HttpCode, HttpStatus, Request, Body, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { MarkAsReadByLinkDto } from './dto/mark-as-read-by-link.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's notifications" })
  @ApiResponse({ status: 200, description: 'A list of notifications', type: [Notification] })
  getNotifications(@Request() req) {
    this.logger.verbose(`[GET-ALL] User ID: ${req.user.userId} is fetching their notifications.`);
    return this.notificationsService.getForUser(req.user.userId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', type: Notification })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  markAsRead(@Request() req, @Param('id', ParseIntPipe) id: number) {
    this.logger.log(`[MARK-READ] User ID: ${req.user.userId} is marking notification ID: ${id} as read.`);
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read.' })
  markAllAsRead(@Request() req) {
    this.logger.log(`[MARK-ALL-READ] User ID: ${req.user.userId} is marking all their notifications as read.`);
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Post('read-by-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notifications as read by link' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read.' })
  markAsReadByLink(@Request() req, @Body() dto: MarkAsReadByLinkDto) {
    this.logger.log(`[MARK-READ-LINK] User ID: ${req.user.userId} is marking notifications with link '${dto.link}' as read.`);
    return this.notificationsService.markAsReadByLink(req.user.userId, dto.link);
  }
}