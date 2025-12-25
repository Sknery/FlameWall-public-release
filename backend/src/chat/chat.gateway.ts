import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, ValidationPipe, Inject, forwardRef } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { WsGuard } from '../auth/guards/ws.guard';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Notification } from '../notifications/entities/notification.entity';
import { FriendshipsService } from '../friendships/friendships.service';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { EditMessageDto } from '../messages/dto/edit-message.dto';
import { DeleteMessageDto } from '../messages/dto/delete-message.dto';
import { LinkingService } from '../linking/linking.service';
import { ConfigService } from '@nestjs/config';
import { AchievementsService } from '../achievements/achievements.service';
import { RegisterTargetsDto } from '../achievements/dto/register-targets.dto';
import { GlobalChatService } from './global-chat.service';
import { ClansService } from 'src/clans/clans.service';
import { ClanChatChannel } from 'src/clans/entities/clan-message.entity';
import { EditClanMessageDto } from 'src/clans/dto/edit-clan-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || [],
    credentials: true,
  },
  allowEIO3: true,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');
  private readonly pluginSecretKey: string;

  private onlineUsers = new Map<number, string>();

  private currentlyViewing = new Map<number, number>();

  constructor(
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly friendshipsService: FriendshipsService,
    private readonly linkingService: LinkingService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => AchievementsService))
    private readonly achievementsService: AchievementsService,
    private readonly globalChatService: GlobalChatService,
    private readonly clansService: ClansService,
  ) {
    const key = this.configService.get<string>('PLUGIN_SECRET_KEY');
    if (!key) {
      throw new Error('PLUGIN_SECRET_KEY is not defined in .env file!');
    }
    this.pluginSecretKey = key;
  }

  async handleConnection(client: Socket) {
    const apiKey = client.handshake.headers['x-api-key'];
    if (apiKey && apiKey === this.pluginSecretKey) {
      client['isPlugin'] = true;
      client.join('minecraft-plugins');
      this.logger.log(`[CONNECT-PLUGIN] 🔌 Minecraft Plugin connected. Socket ID: ${client.id}`);
      return;
    }

    const token = client.handshake.auth.token;
    if (!token) {
      this.logger.warn(`[CONNECT-FAIL] 🔴 Client ${client.id} disconnected. Reason: No auth token provided.`);
      return client.disconnect();
    }
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findUserEntityById(payload.sub);
      if (!user) {
        this.logger.warn(`[CONNECT-FAIL] 🔴 Client ${client.id} disconnected. Reason: User not found for token sub ${payload.sub}.`);
        return client.disconnect();
      }
      if (user.is_banned) {
        this.logger.warn(`[CONNECT-FAIL] 🚫 Banned User ID: ${user.id} (${user.username}) attempted to connect. Disconnecting.`);
        return client.disconnect();
      }

      client['user'] = user;
      client.join(`user-${user.id}`);
      this.onlineUsers.set(user.id, client.id);
      this.logger.log(`[CONNECT-USER] 🟢 User connected: ${user.username} (ID: ${user.id}). Socket ID: ${client.id}`);
      const history = await this.globalChatService.getHistory();
      client.emit('globalChatHistory', history);
    } catch (e) {
      this.logger.warn(`[CONNECT-FAIL] 🔴 Client ${client.id} disconnected. Reason: Invalid auth token. Error: ${e.message}`);
      return client.disconnect();
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('requestGlobalChatHistory')
  async handleRequestHistory(@ConnectedSocket() client: Socket): Promise<void> {
    const history = await this.globalChatService.getHistory();
    client.emit('globalChatHistory', history);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('requestClanChatHistory')
  async handleRequestClanHistory(
    @MessageBody() data: { clanId: number },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user: User = client['user'];
    if (!user || !data.clanId) return;
    try {
      const history = await this.clansService.getClanMessages(data.clanId, user.id);
      client.emit('clanChatHistory', { clanId: data.clanId, messages: history });
    } catch (e) {
      this.logger.warn(`Failed to get clan chat history for user ${user.id} in clan ${data.clanId}: ${e.message}`);
      client.emit('clanChatError', { message: 'You do not have permission to view this chat history.' });
    }
  }

  handleDisconnect(client: Socket) {
    if (client['isPlugin']) {
      this.logger.log(`[DISCONNECT-PLUGIN] 🔌 Minecraft Plugin disconnected. Socket ID: ${client.id}`);
      return;
    }
    const user: User = client['user'];
    if (user) {
      if (this.onlineUsers.get(user.id) === client.id) {
        this.onlineUsers.delete(user.id);
      }
      this.currentlyViewing.delete(user.id);
      this.logger.log(`[DISCONNECT-USER] 🔴 User disconnected: ${user.username} (ID: ${user.id}). Socket ID: ${client.id}`);
    } else {
      this.logger.verbose(`[DISCONNECT] ❓ An unknown client disconnected. Socket ID: ${client.id}`);
    }
  }

  /**
   * Listens for 'sendMessage' events from web clients to send a private message.
   * @param data - The message payload, including recipient and content.
   * @param client - The sender's socket.
   */
  @UseGuards(WsGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody(new ValidationPipe()) data: CreateMessageDto & { parentMessageId?: number },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const sender: User = client['user'];
    if (!sender) return;

    this.logger.verbose(`[MSG-WEB] 💬 Message attempt from web: User ID ${sender.id} -> User ID ${data.recipientId}`);

    const recipient = await this.usersService.findUserEntityById(data.recipientId);
    if (!recipient) {
      this.logger.warn(`[MSG-FAIL] ❌ User ID ${sender.id} tried to message non-existent User ID ${data.recipientId}`);
      return;
    }

    const areFriends = await this.friendshipsService.areTheyFriends(sender.id, recipient.id);
    if (!areFriends) {
      this.logger.warn(`[MSG-DENIED] 🚫 Message denied between non-friends: ${sender.id} and ${recipient.id}.`);
      return;
    }
    const savedMessage = await this.messagesService.createMessage(sender, recipient, data.content, data.parentMessageId);
    if (!savedMessage) return;

    const recipientIsViewing = this.currentlyViewing.get(recipient.id) === sender.id;
    if (!recipientIsViewing && sender.id !== recipient.id) {
      this.eventEmitter.emit('message.sent', { sender, recipient });
    }

    this.logger.log(`[MSG-WEB-EMIT] 📡 Emitting 'newMessage' to web sockets for User ID ${recipient.id} and ${sender.id}.`);

    this.server.to(`user-${recipient.id}`).emit('newMessage', savedMessage);
    if (sender.id !== recipient.id) {
      this.server.to(`user-${sender.id}`).emit('newMessage', savedMessage);
    }

    this.logger.verbose(`[MSG-RELAY-CHECK] 🤔 Checking if User ID ${recipient.id} is in-game for message relay...`);
    if (recipient.minecraft_uuid && recipient.is_minecraft_online) {
      this.logger.log(`[MSG-RELAY] ➡️ Relaying message from ${sender.username} to in-game player ${recipient.username} (UUID: ${recipient.minecraft_uuid})`);
      this.server.to('minecraft-plugins').emit('webPrivateMessage', {
        recipientUuid: recipient.minecraft_uuid,
        senderUsername: sender.minecraft_username || sender.username,
        content: data.content,
      });
    } else {
      this.logger.verbose(`[MSG-RELAY-SKIP] ➡️ Skipping relay. Recipient ${recipient.username} is not online in-game or not linked.`);
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @MessageBody(new ValidationPipe()) data: EditMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const sender: User = client['user'];
    if (!sender) return;

    try {
      this.logger.verbose(`[MSG-EDIT] 📝 User ID ${sender.id} is editing message ID ${data.messageId}`);
      const updatedMessage = await this.messagesService.editMessage(data.messageId, data.content, sender.id);

      this.server.to(`user-${updatedMessage.sender_id}`).emit('messageUpdated', updatedMessage);
      if (updatedMessage.sender_id !== updatedMessage.receiver_id) {
        this.server.to(`user-${updatedMessage.receiver_id}`).emit('messageUpdated', updatedMessage);
      }
    } catch (error) {
      this.logger.warn(`[MSG-EDIT-FAIL] ❌ User ID ${sender.id} failed to edit message ID ${data.messageId}: ${error.message}`);
      client.emit('chatError', { message: error.message });
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @MessageBody(new ValidationPipe()) data: DeleteMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const sender: User = client['user'];
    if (!sender) return;

    try {
      this.logger.warn(`[MSG-DELETE] 🗑️ User ID ${sender.id} is deleting message ID ${data.messageId}`);
      const updatedMessage = await this.messagesService.deleteMessage(data.messageId, sender.id);

      this.server.to(`user-${updatedMessage.sender_id}`).emit('messageUpdated', updatedMessage);
      if (updatedMessage.sender_id !== updatedMessage.receiver_id) {
        this.server.to(`user-${updatedMessage.receiver_id}`).emit('messageUpdated', updatedMessage);
      }
    } catch (error) {
      this.logger.warn(`[MSG-DELETE-FAIL] ❌ User ID ${sender.id} failed to delete message ID ${data.messageId}: ${error.message}`);
      client.emit('chatError', { message: error.message });
    }
  }

  /**
   * Listens for 'inGamePrivateMessage' events from game plugins.
   * @param data - The message payload from the game.
   * @param client - The plugin's socket.
   */
  @SubscribeMessage('inGamePrivateMessage')
  async handleInGameMessage(
    @MessageBody() data: { senderUuid: string; recipientUsername: string; content: string; },
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    if (!client['isPlugin']) return;

    this.logger.verbose(`[MSG-GAME] 🎮 Received private message from plugin. Sender UUID: ${data.senderUuid}, Recipient Name: ${data.recipientUsername}`);

    const sender = await this.usersService.findUserByMinecraftUuid(data.senderUuid);
    if (!sender) {
      this.logger.warn(`[MSG-GAME-FAIL] ⚠️ Sender with UUID ${data.senderUuid} is not linked. Emitting 'senderNotLinked'.`);
      client.emit('senderNotLinked', { senderUuid: data.senderUuid });
      return;
    }

    const recipient = await this.usersService.findOneByMinecraftUsername(data.recipientUsername);
    if (recipient) {
      this.logger.log(`[MSG-GAME-LINKED] ✅ Recipient ${data.recipientUsername} is linked to website User ID ${recipient.id}. Processing friendship and saving message.`);
      const areFriends = await this.friendshipsService.areTheyFriends(sender.id, recipient.id);
      if (!areFriends) {
        this.logger.warn(`[MSG-GAME-DENIED] 🚫 Message from ${sender.username} to ${recipient.username} denied (not friends).`);
        client.emit('privateMessageError', { senderUuid: sender.minecraft_uuid, error: `You are not friends with ${recipient.username}.` });
        return;
      }
      const savedMessage = await this.messagesService.createMessage(sender, recipient, data.content);
      if (savedMessage) {
        this.logger.log(`[MSG-GAME-SUCCESS] ✅ Message from ${sender.username} to ${recipient.username} saved. Emitting success events.`);
        this.logger.verbose(`[MSG-GAME-EMIT] 📡 Emitting 'inGameMessageSuccess' with recipientUsername: ${data.recipientUsername}`);
        this.server.to('minecraft-plugins').emit('inGameMessageSuccess', {
          senderUuid: sender.minecraft_uuid,
          recipientUsername: data.recipientUsername,
          content: data.content
        });
        const recipientIsViewing = this.currentlyViewing.get(recipient.id) === sender.id;
        if (!recipientIsViewing && sender.id !== recipient.id) {
          this.eventEmitter.emit('message.sent', { sender, recipient });
        }
        this.server.to(`user-${sender.id}`).emit('newMessage', savedMessage);
        this.server.to(`user-${recipient.id}`).emit('newMessage', savedMessage);
      }
    } else {
      this.logger.log(`[MSG-GAME-DIRECT] ➡️ Recipient ${data.recipientUsername} is not linked. Emitting 'deliverInGameDirectly' for direct in-game delivery.`);
      client.emit('deliverInGameDirectly', {
        senderUuid: sender.minecraft_uuid,
        recipientUsername: data.recipientUsername,
        content: data.content
      });
    }
  }

  /**
   * Listens for a 'minecraftPlayerStatus' event from a game plugin to update a user's online status.
   * @param data - Payload containing the player's UUID and their new online status.
   * @param client - The plugin's socket.
   */
  @SubscribeMessage('minecraftPlayerStatus')
  async handlePlayerStatus(
    @MessageBody() data: { minecraftUuid: string; isOnline: boolean },
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    if (!client['isPlugin']) return;
    this.logger.log(`[MC-STATUS] 🚦 Player status update: UUID ${data.minecraftUuid} is now ${data.isOnline ? 'ONLINE' : 'OFFLINE'}`);
    await this.usersService.updateOnlineStatus(data.minecraftUuid, data.isOnline);
    this.server.emit('playerStatusUpdate', {
      uuid: data.minecraftUuid,
      isOnline: data.isOnline,
    });
  }

  /**
   * Listens for a 'linkAccount' event from a game plugin to link a Minecraft account to a web account.
   * @param data - Payload containing the one-time code, UUID, and username from the game.
   * @param client - The plugin's socket.
   */
  @SubscribeMessage('linkAccount')
  async handleLinkAccount(@MessageBody() data: { code: string; minecraftUuid: string; minecraftUsername: string; }, @ConnectedSocket() client: Socket): Promise<void> {
    try {
      const linkedUser = await this.linkingService.verifyCodeAndLinkAccount(
        data.code,
        data.minecraftUuid,
        data.minecraftUsername,
      );
      this.logger.log(`[LINK-SUCCESS] ✅ User ${linkedUser.username} (ID: ${linkedUser.id}) linked to MC Account: ${linkedUser.minecraft_username} (UUID: ${data.minecraftUuid})`);
      client.emit('linkStatus', { success: true, minecraftUuid: linkedUser.minecraft_uuid, websiteUsername: linkedUser.username });
      this.server.to(`user-${linkedUser.id}`).emit('linkStatus', { success: true, minecraftUsername: linkedUser.minecraft_username });
    } catch (error) {
      this.logger.warn(`[LINK-FAIL] ❌ Failed link attempt for MC UUID: ${data.minecraftUuid} with code: ${data.code}. Reason: ${error.message}`);
      client.emit('linkStatus', { success: false, minecraftUuid: data.minecraftUuid, error: error.message });
    }
  }

  /**
   * Listens for an internal 'friendship.requested.ingame' event to push a notification
   * to an online player in the game.
   * @param payload - Data about the friend request.
   */
  @OnEvent('friendship.requested.ingame')
  async handleFriendRequestIngame(payload: { requester: User, receiver: User, requestId: number }) {
    const { requester, receiver, requestId } = payload;
    const freshReceiver = await this.usersService.findById(receiver.id);
    if (!freshReceiver) {
      this.logger.error(`[FRIEND-REQ-FATAL] 🔥 User with ID ${receiver.id} NOT FOUND in friendship.requested.ingame event.`);
      return;
    }
    if (freshReceiver?.is_minecraft_online && freshReceiver.minecraft_uuid) {
      this.logger.log(`[FRIEND-REQ-GAME] 💌 Pushing friend request from ${requester.username} to in-game player ${freshReceiver.username}`);
      const requesterPayload = {
        username: requester.username,
        minecraftUsername: requester.minecraft_username,
        profileUrl: `https://flamewall.xyz/users/${requester.profile_slug || requester.id}`,
        rankName: requester.rank?.name || 'User',
        rankColor: requester.rank?.display_color || '#AAAAAA',
        reputation: requester.reputation_count || 0,
      };
      this.server.to('minecraft-plugins').emit('incomingFriendRequest', {
        receiverUuid: freshReceiver.minecraft_uuid,
        requestId: requestId,
        requester: requesterPayload,
      });
    } else {
      this.logger.verbose(`[FRIEND-REQ-GAME] ➡️ Receiver ${receiver.username} is offline. Skipping in-game notification.`);
    }
  }

  /**
   * Handles WebSocket requests from game plugins to register their dynamic achievement targets.
   * @param data - The DTO containing the plugin name and its targets.
   * @param client - The socket of the game plugin.
   */
  @SubscribeMessage('registerTargets')
  handleRegisterTargets(
    @MessageBody() data: RegisterTargetsDto,
    @ConnectedSocket() client: Socket,
  ): void {
    if (!client['isPlugin']) {
      this.logger.warn(`[ACHIEVEMENT-REGISTER-DENIED] Attempt to register targets from a non-plugin. Socket ID: ${client.id}`);
      return;
    }
    this.logger.log(`[ACHIEVEMENT-REGISTER-WS] 🏆 Received achievement targets from plugin '${data.pluginName}' via WebSocket.`);
    this.achievementsService.registerDynamicTargets(data);
  }

  /**
   * Pushes newly created notifications to the corresponding user's client.
   * This is triggered by an internal application event.
   * @param payload - The Notification entity.
   */
  @OnEvent('notification.created')
  handleNotificationCreated(payload: Notification) {
    if (payload?.user?.id) {
      const room = `user-${payload.user.id}`;
      this.logger.verbose(`[NOTIFY-PUSH] ✨ Pushing notification (Type: '${payload.type}') to User ID: ${payload.user.id}`);
      this.server.to(room).emit('newNotification', payload);
    } else {
      this.logger.warn(`[NOTIFY-FAIL] ⚠️ Received malformed notification event payload.`);
    }
  }

  /**
   * Listens for an event indicating a new purchasable command has been queued.
   * It then sends a signal to all connected game plugins to fetch pending commands.
   */
  @OnEvent('command.queued')
  handleCommandQueued() {
    this.logger.log(`[EVENT-GATEWAY] Caught 'command.queued' event. Pushing 'shop:new-command' to plugin...`);
    this.server.to('minecraft-plugins').emit('shop:new-command');
  }

  /**
   * Handles a 'sendGlobalMessage' event from a web client.
   * @param data - The payload containing the message content and optional parent ID for replies.
   * @param client - The sender's socket.
   */
  @UseGuards(WsGuard)
  @SubscribeMessage('sendGlobalMessage')
  async handleGlobalMessage(
    @MessageBody() data: { content: string, parentId?: number },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user: User = client['user'];
    if (!user || !data.content) return;
    this.logger.log(`[GLOBAL-CHAT-WEB] 💬 User ${user.username} sent global message.`);
    const savedMessage = await this.globalChatService.createMessage(user, data.content, data.parentId);
    this.server.emit('newGlobalMessage', savedMessage);
    this.server.to('minecraft-plugins').emit('globalMessageToGame', savedMessage);
  }

  /**
   * Handles a 'gameGlobalChatMessage' event from a game plugin.
   * @param data - The payload from the game.
   * @param client - The plugin's socket.
   */
  @SubscribeMessage('gameGlobalChatMessage')
  async handleGameGlobalChatMessage(
    @MessageBody() data: { senderUuid: string, content: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!client['isPlugin']) return;
    const sender = await this.usersService.findUserByMinecraftUuid(data.senderUuid);
    if (!sender) return;
    this.logger.log(`[GLOBAL-CHAT-GAME] 🎮 Player ${sender.username} sent a new message.`);
    const savedMessage = await this.globalChatService.createMessage(sender, data.content);
    this.server.emit('newGlobalMessage', savedMessage);
    this.server.to('minecraft-plugins').emit('globalMessageToGame', savedMessage);
  }

  /**
   * Handles a reply in the global chat coming from a game plugin.
   * @param data - The payload from the game, including the parent message ID.
   * @param client - The plugin's socket.
   */
  @SubscribeMessage('gameGlobalChatReply')
  async handleGameGlobalChatReply(
    @MessageBody() data: { senderUuid: string, content: string, parentId: number },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!client['isPlugin']) return;
    const sender = await this.usersService.findUserByMinecraftUuid(data.senderUuid);
    if (!sender) return;
    this.logger.log(`[GLOBAL-CHAT-GAME] 🎮 Player ${sender.username} replied to message #${data.parentId}.`);
    const savedMessage = await this.globalChatService.createMessage(sender, data.content, data.parentId);
    this.server.emit('newGlobalMessage', savedMessage);
    this.server.to('minecraft-plugins').emit('globalMessageToGame', savedMessage);
  }

  /**
   * Allows a web client to join the appropriate clan chat rooms (general and admin).
   * @param data - Payload containing the clan ID.
   * @param client - The user's socket.
   */
  @UseGuards(WsGuard)
  @SubscribeMessage('joinClanChat')
  async handleJoinClanChat(
    @MessageBody() data: { clanId: number },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user: User = client['user'];
    const { clanId } = data;
    const membership = await this.clansService.findMember(clanId, user.id);
    if (!membership) return;
    const generalRoom = `clan-${clanId}-general`;
    client.join(generalRoom);
    this.logger.log(`User ${user.username} joined clan chat room: ${generalRoom}`);
    const canAccessAdminChat = membership.role?.permissions?.clanPermissions?.canAccessAdminChat;
    if (canAccessAdminChat) {
      const adminRoom = `clan-${clanId}-admin`;
      client.join(adminRoom);
      this.logger.log(`User ${user.username} joined clan admin chat room: ${adminRoom}`);
    }
  }

  /**
   * Handles a user leaving the clan chat rooms.
   * @param data - Payload containing the clan ID.
   * @param client - The user's socket.
   */
  @UseGuards(WsGuard)
  @SubscribeMessage('leaveClanChat')
  handleLeaveClanChat(
    @MessageBody() data: { clanId: number },
    @ConnectedSocket() client: Socket,
  ): void {
    const { clanId } = data;
    client.leave(`clan-${clanId}-general`);
    client.leave(`clan-${clanId}-admin`);
    this.logger.log(`User ${client['user']?.username} left clan chat rooms for clan ${clanId}`);
  }

  /**
   * Handles sending a message within a clan chat, and also processes chat commands.
   * @param data - Payload with clan ID, content, channel, and optional parent ID.
   * @param client - The sender's socket.
   */
  @UseGuards(WsGuard)
  @SubscribeMessage('sendClanMessage')
  async handleClanMessage(
    @MessageBody() data: { clanId: number; content: string; channel: ClanChatChannel; parentId?: number },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user: User = client['user'];
    if (data.parentId && data.content.startsWith('/')) {
      await this.handleClanCommand(client, { ...data, parentId: data.parentId });
      return;
    }
    try {
      const savedMessage = await this.clansService.createClanMessage(
        data.clanId, user.id, data.content, data.channel, data.parentId
      );
      const room = `clan-${data.clanId}-${data.channel}`;
      this.server.to(room).emit('newClanMessage', savedMessage);
      this.logger.log(`Message from ${user.username} broadcasted to room ${room}`);
    } catch (error) {
      client.emit('clanChatError', { message: error.message });
    }
  }

  /**
   * Private helper method to parse and execute chat commands (e.g., /kick, /mute)
   * sent as replies in the clan chat.
   * @param client - The actor's socket.
   * @param data - The command payload.
   */
  private async handleClanCommand(client: Socket, data: { clanId: number; content: string; parentId: number; channel: ClanChatChannel }): Promise<void> {
    const actor: User = client['user'];
    const { clanId, content, parentId } = data;
    const parts = content.slice(1).trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);
    try {
      let resultMessage: string | null = null;
      switch (command) {
        case 'kick': resultMessage = await this.clansService.kickMemberByChat(clanId, actor.id, parentId, args.join(' ')); break;
        case 'mute': resultMessage = await this.clansService.muteMemberByChat(clanId, actor.id, parentId, args); break;
        case 'warn': resultMessage = await this.clansService.warnMemberByChat(clanId, actor.id, parentId, args.join(' ')); break;
        case 'role': resultMessage = await this.clansService.changeRoleByChat(clanId, actor.id, parentId, args); break;
        case 'unwarn': resultMessage = await this.clansService.revokeMostRecentWarning(clanId, actor.id, parentId); break;
        case 'unmute': resultMessage = await this.clansService.unmuteMemberByChat(clanId, actor.id, parentId); break;
        default: throw new Error(`Unknown command: /${command}`);
      }
      if (resultMessage) {
        client.emit('clanChatFeedback', { type: 'success', message: resultMessage });
      }
    } catch (error) {
      client.emit('clanChatError', { message: error.message });
    }
  }

  /**
   * Handles the soft-deletion of a clan message.
   * @param data - Payload with clan ID and message ID.
   * @param client - The actor's socket.
   */
  @UseGuards(WsGuard)
  @SubscribeMessage('deleteClanMessage')
  async handleDeleteClanMessage(
    @MessageBody() data: { clanId: number; messageId: number },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user: User = client['user'];
    try {
      const updatedMessage = await this.clansService.deleteClanMessage(data.clanId, user.id, data.messageId);
      const room = `clan-${data.clanId}-${updatedMessage.channel}`;
      this.server.to(room).emit('clanMessageUpdated', updatedMessage);
      this.logger.log(`Message ${data.messageId} in clan ${data.clanId} was deleted by ${user.username}`);
    } catch (error) {
      client.emit('clanChatError', { message: error.message });
    }
  }

  /**
   * Handles editing the content of a clan message.
   * @param data - DTO with clan ID, message ID, and new content.
   * @param client - The actor's socket.
   */
  @UseGuards(WsGuard)
  @SubscribeMessage('editClanMessage')
  async handleEditClanMessage(
    @MessageBody() data: EditClanMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user: User = client['user'];
    try {
      const updatedMessage = await this.clansService.editClanMessage(data.clanId, user.id, data.messageId, data.content);
      const room = `clan-${data.clanId}-${updatedMessage.channel}`;
      this.server.to(room).emit('clanMessageUpdated', updatedMessage);
      this.logger.log(`Message ${data.messageId} in clan ${data.clanId} was edited by ${user.username}`);
    } catch (error) {
      client.emit('clanChatError', { message: error.message });
    }
  }
}

