import { Controller, Post, Body, UseGuards, Delete, Get, Param, ValidationPipe, Logger } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { FriendshipsService } from './friendships.service';
import { PluginApiKeyGuard } from '../auth/guards/plugin-api-key.guard';
import { FromPluginAddFriendDto } from './dto/from-plugin-add-friend.dto';
import { FromPluginRemoveFriendDto } from './dto/from-plugin-remove-friend.dto';
import { FromPluginRespondRequestDto } from './dto/from-plugin-respond-request.dto';


@ApiTags('Plugin Bridge')
@Controller('friendships/from-plugin')
@UseGuards(PluginApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The secret API key for the Minecraft plugin',
  required: true,
})
export class FriendshipsPluginController {
  private readonly logger = new Logger(FriendshipsPluginController.name);

  constructor(private readonly friendshipsService: FriendshipsService) { }


  @Post('add')
  addFriendFromPlugin(@Body(new ValidationPipe()) dto: FromPluginAddFriendDto) {
    this.logger.log(`[PLUGIN-REQ-SEND] 🔌 Plugin initiated friend request from UUID: ${dto.requesterUuid} to Receiver Name: ${dto.receiverName}`);
    return this.friendshipsService.sendRequestFromPlugin(dto.requesterUuid, dto.receiverName);
  }


  @Delete('remove')
  removeFriendFromPlugin(@Body(new ValidationPipe()) dto: FromPluginRemoveFriendDto) {
    this.logger.warn(`[PLUGIN-REMOVE] 🔌 Plugin initiated friend removal by UUID: ${dto.removerUuid} of friend: ${dto.friendToRemoveName}`);
    return this.friendshipsService.removeFriendFromPlugin(dto.removerUuid, dto.friendToRemoveName);
  }


  @Get('list/:uuid')
  listFriendsForPlugin(@Param('uuid') uuid: string): Promise<string[]> {
    this.logger.verbose(`[PLUGIN-LIST] 🔌 Plugin requested friend list for UUID: ${uuid}`);
    return this.friendshipsService.listFriendsForPlugin(uuid);
  }


  @Post('accept')
  acceptRequestFromPlugin(@Body(new ValidationPipe()) dto: FromPluginRespondRequestDto) {
    this.logger.log(`[PLUGIN-REQ-ACCEPT] 🔌 Plugin initiated request acceptance by UUID: ${dto.responderUuid} for request ID: ${dto.requestId}`);
    return this.friendshipsService.acceptRequestFromPlugin(dto.responderUuid, dto.requestId);
  }


  @Post('deny')
  denyRequestFromPlugin(@Body(new ValidationPipe()) dto: FromPluginRespondRequestDto) {
    this.logger.warn(`[PLUGIN-REQ-DENY] 🔌 Plugin initiated request denial by UUID: ${dto.responderUuid} for request ID: ${dto.requestId}`);
    return this.friendshipsService.rejectRequestFromPlugin(dto.responderUuid, dto.requestId);
  }
}
