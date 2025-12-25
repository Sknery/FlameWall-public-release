import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not } from 'typeorm';
import { Friendship } from './entities/friendship.entity';
import { User } from '../users/entities/user.entity';
import { FriendStatuses } from '../common/enums/friend-statuses.enum';
import { PublicUser, UsersService } from '../users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FriendshipRejection } from './entities/friendship-rejection.entity';
import { EventsService } from 'src/events/events.service';


export type FriendWithFriendshipId = {
  friendshipId: number;
  user: PublicUser;
}


@Injectable()
export class FriendshipsService {
  private readonly logger = new Logger(FriendshipsService.name);

  constructor(
    @InjectRepository(Friendship)
    private friendshipsRepository: Repository<Friendship>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
    @InjectRepository(FriendshipRejection)
    private rejectionRepository: Repository<FriendshipRejection>,
    private readonly eventsService: EventsService,
  ) { }


  async sendRequest(requesterId: number, receiverId: number): Promise<Friendship> {
    if (requesterId === receiverId) {
      this.logger.warn(`[REQ-SEND-FAIL] ⚠️ User ID: ${requesterId} tried to send a friend request to themselves.`);
      throw new ForbiddenException('You cannot send a friend request to yourself.');
    }

    const rejection = await this.rejectionRepository.findOneBy({
      rejector_id: receiverId,
      requester_id: requesterId,
    });

    if (rejection) {
      this.logger.warn(`[REQ-SEND-FAIL] ⚠️ User ${requesterId} tried to re-request friendship from ${receiverId} after rejection.`);
      throw new ForbiddenException("This user has previously declined your friend request. You cannot send another one.");
    }

    const [requester, receiver] = await Promise.all([
      this.usersRepository.findOneBy({ id: requesterId }),
      this.usersRepository.findOneBy({ id: receiverId }),
    ]);
    if (!receiver || !requester) {
      this.logger.error(`[REQ-SEND-FAIL] ❌ User not found. Requester: ${requesterId}, Receiver: ${receiverId}`);
      throw new NotFoundException(`User not found.`);
    }

    const existingFriendship = await this.friendshipsRepository.findOne({
      where: [
        { requester_id: requesterId, receiver_id: receiverId },
        { requester_id: receiverId, receiver_id: requesterId },
      ],
    });

    if (existingFriendship) {
      this.logger.warn(`[REQ-SEND-FAIL] ⚠️ Conflict: Friendship/request already exists between User ID: ${requesterId} and User ID: ${receiverId}.`);
      throw new ConflictException('A friendship request already exists or you are already friends.');
    }

    const newRequest = this.friendshipsRepository.create({ requester_id: requesterId, receiver_id: receiverId, status: FriendStatuses.PENDING });
    const savedRequest = await this.friendshipsRepository.save(newRequest);
    this.logger.log(`[REQ-SEND-SUCCESS] ✅ User ID: ${requesterId} sent a friend request to User ID: ${receiverId}. Friendship ID: ${savedRequest.id}`);

    this.eventEmitter.emit('friendship.requested', { requester: requester, receiver: receiver });
    this.eventEmitter.emit('friendship.requested.ingame', { requester: requester, receiver: receiver, requestId: savedRequest.id });

    return savedRequest;
  }


  async getPendingRequests(userId: number): Promise<Friendship[]> {
    this.logger.verbose(`[GET] 🔎 Fetching pending friend requests for User ID: ${userId}`);
    return this.friendshipsRepository.find({
      where: { receiver_id: userId, status: FriendStatuses.PENDING },
      relations: ['requester'],
    });
  }


  async acceptRequest(requestId: number, currentUserId: number): Promise<Friendship> {
    const request = await this.friendshipsRepository.findOne({
      where: { id: requestId, receiver_id: currentUserId, status: FriendStatuses.PENDING },
      relations: ['requester', 'receiver'],
    });

    if (!request) {
      this.logger.warn(`[REQ-ACCEPT-FAIL] ⚠️ User ID: ${currentUserId} tried to accept non-existent or invalid request ID: ${requestId}.`);
      throw new NotFoundException(`Pending request with ID ${requestId} not found for you.`);
    }

    request.status = FriendStatuses.ACCEPTED;
    const savedRequest = await this.friendshipsRepository.save(request);

    this.logger.log(`[REQ-ACCEPT-SUCCESS] ✅ User ID: ${currentUserId} accepted request ID: ${requestId} from User ID: ${request.requester_id}.`);
    this.eventEmitter.emit('friendship.accepted', { requester: request.requester, receiver: request.receiver });


    const requesterFriendCount = await this.friendshipsRepository.count({
      where: [
        { requester_id: request.requester_id, status: FriendStatuses.ACCEPTED },
        { receiver_id: request.requester_id, status: FriendStatuses.ACCEPTED },
      ]
    });
    this.eventsService.triggerWebsiteEvent('FRIEND_ADDED', request.requester_id, { value: requesterFriendCount });

    const receiverFriendCount = await this.friendshipsRepository.count({
      where: [
        { requester_id: request.receiver_id, status: FriendStatuses.ACCEPTED },
        { receiver_id: request.receiver_id, status: FriendStatuses.ACCEPTED },
      ]
    });
    this.eventsService.triggerWebsiteEvent('FRIEND_ADDED', request.receiver_id, { value: receiverFriendCount });

    return savedRequest;
  }


  async rejectOrCancelRequest(requestId: number, currentUserId: number): Promise<void> {
    const request = await this.friendshipsRepository.findOne({ where: { id: requestId } });
    if (!request) {
      this.logger.warn(`[REJECT/CANCEL-FAIL] ⚠️ Request ID: ${requestId} not found for User ID: ${currentUserId}.`);
      throw new NotFoundException(`Request with ID ${requestId} not found.`);
    }
    if (request.receiver_id !== currentUserId && request.requester_id !== currentUserId) {
      this.logger.error(`[REJECT/CANCEL-FORBIDDEN] 🚫 User ID: ${currentUserId} is not authorized to manage request ID: ${requestId}.`);
      throw new ForbiddenException('You are not authorized to manage this request.');
    }

    if (request.receiver_id === currentUserId) {
      this.logger.log(`[REQ-REJECT] 🚫 User ${currentUserId} is rejecting request from ${request.requester_id}.`);
      const newRejection = this.rejectionRepository.create({
        rejector_id: currentUserId,
        requester_id: request.requester_id
      });
      await this.rejectionRepository.save(newRejection).catch(() => {
        this.logger.warn(`[REQ-REJECT] Rejection record between ${currentUserId} and ${request.requester_id} already exists. Ignoring.`);
      });
    }

    await this.friendshipsRepository.remove(request);
    this.logger.warn(`[REJECT/CANCEL-SUCCESS] 🗑️ Request ID: ${requestId} was removed by User ID: ${currentUserId}.`);
  }


  async removeFriend(friendshipId: number, currentUserId: number): Promise<void> {
    const friendship = await this.friendshipsRepository.findOneBy({ id: friendshipId, status: FriendStatuses.ACCEPTED });
    if (!friendship) {
      this.logger.warn(`[REMOVE-FAIL] ⚠️ Friendship ID ${friendshipId} not found or not in ACCEPTED state for User ID: ${currentUserId}.`);
      throw new NotFoundException(`Friendship with ID ${friendshipId} not found.`);
    }
    if (friendship.receiver_id !== currentUserId && friendship.requester_id !== currentUserId) {
      this.logger.error(`[REMOVE-FORBIDDEN] 🚫 User ID: ${currentUserId} is not part of friendship ID: ${friendshipId}.`);
      throw new ForbiddenException('You are not part of this friendship.');
    }
    await this.friendshipsRepository.remove(friendship);
    this.logger.warn(`[REMOVE-SUCCESS] 🗑️ Friendship ID: ${friendshipId} was removed by User ID: ${currentUserId}.`);
  }


  async listFriends(userId: number): Promise<FriendWithFriendshipId[]> {
    this.logger.verbose(`[GET] 🔎 Fetching friends list for User ID: ${userId}`);
    const friendships = await this.friendshipsRepository.find({ where: [{ requester_id: userId, status: FriendStatuses.ACCEPTED }, { receiver_id: userId, status: FriendStatuses.ACCEPTED }], relations: ['requester', 'receiver'] });
    return friendships.map(friendship => {
      const friendUserEntity = friendship.requester_id === userId ? friendship.receiver : friendship.requester;
      const { password_hash, validatePassword, deleted_at, ...publicFriendData } = friendUserEntity;
      return { friendshipId: friendship.id, user: publicFriendData as PublicUser };
    });
  }


  async getFriendshipStatus(currentUserId: number, otherUserIdentifier: string | number) {
    this.logger.verbose(`[CHECK] 🕵️ Checking friendship status between User ID: ${currentUserId} and Identifier: ${otherUserIdentifier}`);

    const otherUserId = typeof otherUserIdentifier === 'number' ? otherUserIdentifier : parseInt(String(otherUserIdentifier), 10);
    if (isNaN(otherUserId)) {
      throw new NotFoundException(`Invalid identifier provided: ${otherUserIdentifier}`);
    }

    const friendship = await this.friendshipsRepository.createQueryBuilder("friendship")
      .where("(friendship.requester_id = :currentUserId AND friendship.receiver_id = :otherUserId)")
      .orWhere("(friendship.requester_id = :otherUserId AND friendship.receiver_id = :currentUserId)")
      .setParameters({ currentUserId, otherUserId })
      .getOne();

    if (!friendship) {
      return { status: 'none' };
    }

    if (friendship.status === FriendStatuses.PENDING) {
      return friendship.requester_id === currentUserId
        ? { status: 'PENDING_OUTGOING', requestId: friendship.id }
        : { status: 'PENDING_INCOMING', requestId: friendship.id };
    }

    return { status: friendship.status, friendshipId: friendship.id };
  }


  async blockUser(requesterId: number, userToBlockId: number): Promise<Friendship> {
    if (requesterId === userToBlockId) {
      this.logger.warn(`[BLOCK-FAIL] ⚠️ User ID: ${requesterId} tried to block themselves.`);
      throw new ForbiddenException('You cannot block yourself.');
    }
    let friendship = await this.friendshipsRepository.findOne({ where: [{ requester_id: requesterId, receiver_id: userToBlockId }, { requester_id: userToBlockId, receiver_id: requesterId }] });

    if (friendship) {
      this.logger.log(`[BLOCK] 📝 Updating existing friendship between ${requesterId} and ${userToBlockId} to BLOCKED.`);
      friendship.requester_id = requesterId;
      friendship.receiver_id = userToBlockId;
      friendship.status = FriendStatuses.BLOCKED;
    } else {
      this.logger.log(`[BLOCK] 📝 Creating new friendship entry to block User ID ${userToBlockId} by ${requesterId}.`);
      friendship = this.friendshipsRepository.create({ requester_id: requesterId, receiver_id: userToBlockId, status: FriendStatuses.BLOCKED });
    }
    const saved = await this.friendshipsRepository.save(friendship);
    this.logger.warn(`[BLOCK-SUCCESS] 🚫 User ID: ${requesterId} blocked User ID: ${userToBlockId}. Friendship ID: ${saved.id}`);
    return saved;
  }


  async unblockUser(requesterId: number, userToUnblockId: number): Promise<void> {
    const friendship = await this.friendshipsRepository.findOne({ where: { requester_id: requesterId, receiver_id: userToUnblockId, status: FriendStatuses.BLOCKED } });
    if (!friendship) {
      this.logger.warn(`[UNBLOCK-FAIL] ⚠️ User ID: ${requesterId} tried to unblock User ID: ${userToUnblockId}, but no block was found.`);
      throw new NotFoundException('You have not blocked this user.');
    }
    await this.friendshipsRepository.remove(friendship);
    this.logger.log(`[UNBLOCK-SUCCESS] ✅ User ID: ${requesterId} unblocked User ID: ${userToUnblockId}.`);
  }


  async getOutgoingRequests(userId: number): Promise<Friendship[]> {
    this.logger.verbose(`[GET] 🔎 Fetching outgoing friend requests for User ID: ${userId}`);
    return this.friendshipsRepository.find({ where: { requester_id: userId, status: FriendStatuses.PENDING }, relations: ['receiver'] });
  }


  async listBlockedUsers(userId: number): Promise<Friendship[]> {
    this.logger.verbose(`[GET] 🔎 Fetching blocked users list for User ID: ${userId}`);
    return this.friendshipsRepository.find({ where: { requester_id: userId, status: FriendStatuses.BLOCKED }, relations: ['receiver'] });
  }


  async areTheyFriends(userId1: number, userId2: number): Promise<boolean> {
    if (userId1 === userId2) return true;
    this.logger.verbose(`[CHECK] 🕵️ Checking friendship status between User ID ${userId1} and ${userId2}`);
    const friendship = await this.friendshipsRepository.findOne({
      where: [
        { requester_id: userId1, receiver_id: userId2, status: FriendStatuses.ACCEPTED },
        { requester_id: userId2, receiver_id: userId1, status: FriendStatuses.ACCEPTED },
      ],
    });
    return !!friendship;
  }


  async sendRequestFromPlugin(requesterUuid: string, receiverName: string): Promise<Friendship> {
    const requester = await this.usersRepository.findOneBy({ minecraft_uuid: requesterUuid });
    const receiver = await this.usersRepository.findOneBy({ minecraft_username: receiverName });
    if (!requester || !receiver) {
      this.logger.warn(`[PLUGIN-REQ-FAIL] ⚠️ One of the players is not linked. Requester UUID: ${requesterUuid}, Receiver Name: ${receiverName}`);
      throw new NotFoundException('One of the players is not linked to a website account.');
    }
    return this.sendRequest(requester.id, receiver.id);
  }


  async removeFriendFromPlugin(removerUuid: string, friendToRemoveName: string): Promise<void> {
    const remover = await this.usersRepository.findOneBy({ minecraft_uuid: removerUuid });
    const friendToRemove = await this.usersRepository.findOneBy({ minecraft_username: friendToRemoveName });
    if (!remover || !friendToRemove) {
      this.logger.warn(`[PLUGIN-REMOVE-FAIL] ⚠️ One of the players is not linked. Remover UUID: ${removerUuid}, Friend Name: ${friendToRemoveName}`);
      throw new NotFoundException('One of the players is not linked to a website account.');
    }
    const friendship = await this.friendshipsRepository.findOne({
      where: [
        { requester_id: remover.id, receiver_id: friendToRemove.id, status: FriendStatuses.ACCEPTED },
        { requester_id: friendToRemove.id, receiver_id: remover.id, status: FriendStatuses.ACCEPTED },
      ]
    });
    if (!friendship) {
      this.logger.warn(`[PLUGIN-REMOVE-FAIL] ⚠️ Friendship not found between ${remover.username} and ${friendToRemove.username}.`);
      throw new NotFoundException('Friendship not found.');
    }
    return this.removeFriend(friendship.id, remover.id);
  }


  async listFriendsForPlugin(playerUuid: string): Promise<string[]> {
    const user = await this.usersRepository.findOneBy({ minecraft_uuid: playerUuid });
    if (!user) {
      this.logger.warn(`[PLUGIN-LIST-FAIL] ⚠️ Player with UUID: ${playerUuid} is not linked to a website account.`);
      throw new NotFoundException('Player is not linked to a website account.');
    }
    const friendsWithData = await this.listFriends(user.id);
    return friendsWithData.map(f => f.user.minecraft_username || f.user.username);
  }


  async acceptRequestFromPlugin(responderUuid: string, requestId: number): Promise<Friendship> {
    const responder = await this.usersRepository.findOneBy({ minecraft_uuid: responderUuid });
    if (!responder) {
      this.logger.warn(`[PLUGIN-ACCEPT-FAIL] ⚠️ Responding player with UUID: ${responderUuid} is not linked.`);
      throw new NotFoundException('Responding player is not linked to a website account.');
    }
    return this.acceptRequest(requestId, responder.id);
  }


  async rejectRequestFromPlugin(responderUuid: string, requestId: number): Promise<void> {
    const responder = await this.usersRepository.findOneBy({ minecraft_uuid: responderUuid });
    if (!responder) {
      this.logger.warn(`[PLUGIN-DENY-FAIL] ⚠️ Responding player with UUID: ${responderUuid} is not linked.`);
      throw new NotFoundException('Responding player is not linked to a website account.');
    }
    return this.rejectOrCancelRequest(requestId, responder.id);
  }
}
