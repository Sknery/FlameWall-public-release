import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, ParseIntPipe, Patch, Logger } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';


@ApiTags('Friendships')
@Controller('friendships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FriendshipsController {
  private readonly logger = new Logger(FriendshipsController.name);

  constructor(private readonly friendshipsService: FriendshipsService) { }


  @Post('requests')
  @ApiOperation({ summary: 'Send a friend request' })
  sendRequest(@Body() createDto: CreateFriendRequestDto, @Request() req) {
    const actorId = req.user.userId;
    this.logger.log(`[REQ-SEND] 💌 User ID: ${actorId} is sending a friend request to Receiver ID: ${createDto.receiverId}`);
    return this.friendshipsService.sendRequest(actorId, createDto.receiverId);
  }


  @Get('requests/pending')
  @ApiOperation({ summary: 'Get my pending incoming friend requests' })
  getPendingRequests(@Request() req) {
    this.logger.verbose(`[GET] 🔎 User ID: ${req.user.userId} is fetching pending requests.`);
    return this.friendshipsService.getPendingRequests(req.user.userId);
  }


  @Patch('requests/:id/accept')
  @ApiOperation({ summary: 'Accept a friend request' })
  acceptRequest(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const actorId = req.user.userId;
    this.logger.log(`[REQ-ACCEPT] ✅ User ID: ${actorId} is accepting friend request ID: ${id}`);
    return this.friendshipsService.acceptRequest(id, actorId);
  }


  @Delete('requests/:id')
  @ApiOperation({ summary: 'Reject an incoming request or cancel an outgoing request' })
  rejectOrCancelRequest(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const actorId = req.user.userId;
    this.logger.warn(`[REQ-REJECT/CANCEL] ❌ User ID: ${actorId} is rejecting/canceling request ID: ${id}`);
    return this.friendshipsService.rejectOrCancelRequest(id, actorId);
  }


  @Get()
  @ApiOperation({ summary: 'Get my friends list' })
  listFriends(@Request() req) {
    this.logger.verbose(`[GET] 🔎 User ID: ${req.user.userId} is fetching their friends list.`);
    return this.friendshipsService.listFriends(req.user.userId);
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Remove a friend by friendship ID' })
  removeFriend(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const actorId = req.user.userId;
    this.logger.warn(`[REMOVE] 🗑️ User ID: ${actorId} is removing friendship ID: ${id}`);
    return this.friendshipsService.removeFriend(id, actorId);
  }


  @Get('status/:identifier')
  @ApiOperation({ summary: 'Check friendship status with another user' })
  getFriendshipStatus(@Param('identifier') identifier: string, @Request() req) {
    return this.friendshipsService.getFriendshipStatus(req.user.userId, identifier);
  }


  @Post('block/:userToBlockId')
  @ApiOperation({ summary: 'Block a user' })
  blockUser(@Param('userToBlockId', ParseIntPipe) userToBlockId: number, @Request() req) {
    const actorId = req.user.userId;
    this.logger.warn(`[BLOCK] 🚫 User ID: ${actorId} is blocking User ID: ${userToBlockId}`);
    return this.friendshipsService.blockUser(actorId, userToBlockId);
  }


  @Delete('block/:userToUnblockId')
  @ApiOperation({ summary: 'Unblock a user' })
  unblockUser(@Param('userToUnblockId', ParseIntPipe) userToUnblockId: number, @Request() req) {
    const actorId = req.user.userId;
    this.logger.log(`[UNBLOCK] ✅ User ID: ${actorId} is unblocking User ID: ${userToUnblockId}`);
    return this.friendshipsService.unblockUser(actorId, userToUnblockId);
  }


  @Get('requests/outgoing')
  @ApiOperation({ summary: 'Get my pending outgoing friend requests' })
  getOutgoingRequests(@Request() req) {
    return this.friendshipsService.getOutgoingRequests(req.user.userId);
  }


  @Get('blocked')
  @ApiOperation({ summary: 'Get my blocked users list' })
  listBlockedUsers(@Request() req) {
    return this.friendshipsService.listBlockedUsers(req.user.userId);
  }
}
