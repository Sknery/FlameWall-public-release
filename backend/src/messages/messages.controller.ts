import { Controller, Get, Param, ParseIntPipe, Request, UseGuards, Logger, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(private readonly messagesService: MessagesService) { }

    @Get('list')
    @ApiOperation({ summary: "Get current user's conversation list" })
    getConversations(@Request() req) {
        const userId = req.user.userId;
        this.logger.log(`[GET-CONVOS] 📜 User ID: ${userId} is fetching their conversation list.`);
        return this.messagesService.getConversations(userId);
    }

    @Get(':otherUserId')
    @ApiOperation({ summary: 'Get conversation history with another user' })
    getConversation(
        @Request() req,
        @Param('otherUserId', ParseIntPipe) otherUserId: number
    ) {
        const currentUserId = req.user.userId;
        this.logger.log(`[GET-CONVO] 💬 User ID: ${currentUserId} is fetching conversation with User ID: ${otherUserId}`);
        return this.messagesService.getConversation(currentUserId, otherUserId);
    }

    @Post(':otherUserId/read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
    markAsRead(
        @Request() req,
        @Param('otherUserId', ParseIntPipe) otherUserId: number
    ) {
        const currentUserId = req.user.userId;
        this.logger.log(`[MARK-READ] 📬 User ID: ${currentUserId} is marking conversation with User ID: ${otherUserId} as read.`);
        return this.messagesService.markConversationAsRead(currentUserId, otherUserId);
    }
}
