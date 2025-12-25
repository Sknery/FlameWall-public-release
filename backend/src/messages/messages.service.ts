import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { FindOperator, IsNull, Not, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { recentMessageSignatures } from '../chat/connection-lock';
import { Friendship } from '../friendships/entities/friendship.entity';
import { FriendStatuses } from '../common/enums/friend-statuses.enum';
import { EditMessageDto } from './dto/edit-message.dto';

@Injectable()
export class MessagesService {
    private logger: Logger = new Logger('MessagesService');

    constructor(
        @InjectRepository(Message)
        private messagesRepository: Repository<Message>,
        @InjectRepository(Friendship)
        private friendshipRepository: Repository<Friendship>,
    ) { }

    async createMessage(sender: User, receiver: User, content: string, parentMessageId?: number): Promise<Message | null> {
        const signature = `${sender.id}-${receiver.id}-${content}`;
        if (recentMessageSignatures.has(signature)) {
            this.logger.warn(`[MSG-DUPLICATE] ⚠️ Duplicate message blocked from User ID: ${sender.id} to User ID: ${receiver.id}.`);
            return null;
        }
        recentMessageSignatures.add(signature);
        setTimeout(() => {
            recentMessageSignatures.delete(signature);
        }, 2000);

        const message = this.messagesRepository.create({
            sender,
            receiver,
            content,
            parentMessageId,
        });

        try {
            const savedMessage = await this.messagesRepository.save(message);
            this.logger.verbose(`[MSG-CREATE-SUCCESS] ✅ Message created (ID: ${savedMessage.id}) between User ID: ${sender.id} and User ID: ${receiver.id}.`);
            return this.messagesRepository.findOneOrFail({
                where: { id: savedMessage.id },
                relations: ['sender', 'receiver', 'sender.rank', 'receiver.rank', 'parentMessage', 'parentMessage.sender'],
            });
        } catch (error) {
            this.logger.error(`[MSG-CREATE-FAIL] ❌ Failed to save message from User ID: ${sender.id} to User ID: ${receiver.id}.`, error.stack);
            recentMessageSignatures.delete(signature);
            return null;
        }
    }

    async getConversation(userId1: number, userId2: number): Promise<Message[]> {
        this.logger.verbose(`[DB-GET-CONVO] 💾 Fetching conversation from DB between User ID: ${userId1} and User ID: ${userId2}`);

        const areFriends = await this.friendshipRepository.findOne({
            where: [
                { requester_id: userId1, receiver_id: userId2, status: FriendStatuses.ACCEPTED },
                { requester_id: userId2, receiver_id: userId1, status: FriendStatuses.ACCEPTED },
            ]
        });

        if (!areFriends && userId1 !== userId2) {
            throw new ForbiddenException("You can only view conversations with your friends.");
        }

        return this.messagesRepository.find({
            where: [
                { sender_id: userId1, receiver_id: userId2 },
                { sender_id: userId2, receiver_id: userId1 },
            ],
            relations: ['sender', 'receiver', 'sender.rank', 'receiver.rank', 'parentMessage', 'parentMessage.sender'],
            order: { sent_at: 'ASC' },
        });
    }

    async getConversations(userId: number) {
        this.logger.log(`[CONVO-LIST] 1. Starting to get conversation list for User ID: ${userId}`);

        const friendships = await this.friendshipRepository.find({
            where: [
                { requester_id: userId, status: FriendStatuses.ACCEPTED },
                { receiver_id: userId, status: FriendStatuses.ACCEPTED },
            ],
            relations: ['requester', 'receiver', 'requester.rank', 'receiver.rank'],
        });
        this.logger.log(`[CONVO-LIST] 2. Found ${friendships.length} friendships.`);

        if (friendships.length === 0) {
            this.logger.log(`[CONVO-LIST] User has no friends. Returning empty array.`);
            return [];
        }

        const friendIds = friendships.map(f => f.requester_id === userId ? f.receiver_id : f.requester_id);
        this.logger.log(`[CONVO-LIST] 3. Friend IDs: [${friendIds.join(', ')}]`);

        const lastMessagesQuery = this.messagesRepository
            .createQueryBuilder('message')
            .distinctOn(['LEAST(message.sender_id, message.receiver_id)', 'GREATEST(message.sender_id, message.receiver_id)'])
            .where('(message.sender_id = :userId AND message.receiver_id IN (:...friendIds)) OR (message.sender_id IN (:...friendIds) AND message.receiver_id = :userId)', { userId, friendIds })
            .orderBy('LEAST(message.sender_id, message.receiver_id), GREATEST(message.sender_id, message.receiver_id)')
            .addOrderBy('message.sent_at', 'DESC');

        const unreadCountsQuery = this.messagesRepository
            .createQueryBuilder('message')
            .select('message.sender_id', 'senderId')
            .addSelect('COUNT(message.id)', 'count')
            .where('message.receiver_id = :userId', { userId })
            .andWhere('message.viewed_at IS NULL')
            .groupBy('message.sender_id')
            .getRawMany();

        this.logger.log(`[CONVO-LIST] 4. Executing lastMessages and unreadCounts queries in parallel...`);
        const [lastMessages, unreadCounts] = await Promise.all([
            lastMessagesQuery.getMany(),
            unreadCountsQuery,
        ]);
        this.logger.log(`[CONVO-LIST] 5. Queries finished. Found ${lastMessages.length} last messages and ${unreadCounts.length} unread count groups.`);

        const unreadMap = new Map(unreadCounts.map(item => [item.senderId, parseInt(item.count, 10)]));
        const lastMessageMap = new Map();
        for (const msg of lastMessages) {
            const key = [msg.sender_id, msg.receiver_id].sort().join('-');
            lastMessageMap.set(key, msg);
        }

        const conversationPreviews = friendships.map(friendship => {
            const otherUser = friendship.requester_id === userId ? friendship.receiver : friendship.requester;
            const conversationKey = [userId, otherUser.id].sort().join('-');
            const lastMessage = lastMessageMap.get(conversationKey);

            return {
                otherUser,
                lastMessage: lastMessage || null,
                unreadCount: unreadMap.get(otherUser.id) || 0,
            };
        });

        conversationPreviews.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.sent_at).getTime() - new Date(a.lastMessage.sent_at).getTime();
        });

        this.logger.log(`[CONVO-LIST] 6. Mapping and sorting finished. Returning ${conversationPreviews.length} previews.`);
        return conversationPreviews;
    }

    async markConversationAsRead(currentUserId: number, otherUserId: number): Promise<{ affected: number }> {
        const result = await this.messagesRepository.update(
            {
                receiver_id: currentUserId,
                sender_id: otherUserId,
                viewed_at: IsNull(),
            },
            {
                viewed_at: new Date(),
            }
        );
        return { affected: result.affected || 0 };
    }

    async editMessage(messageId: number, newContent: string, actorId: number): Promise<Message> {
        const message = await this.messagesRepository.findOne({
            where: { id: messageId },
            relations: ['sender', 'receiver', 'sender.rank', 'receiver.rank', 'parentMessage', 'parentMessage.sender'],
        });

        if (!message) {
            throw new NotFoundException('Message not found.');
        }

        if (message.sender_id !== actorId) {
            throw new ForbiddenException('You can only edit your own messages.');
        }

        const timeSinceCreation = new Date().getTime() - new Date(message.sent_at).getTime();
        const tenMinutes = 10 * 60 * 1000;
        if (timeSinceCreation > tenMinutes) {
            throw new ForbiddenException('You can no longer edit this message.');
        }

        message.content = newContent;
        message.updated_at = new Date();
        return this.messagesRepository.save(message);
    }

    async deleteMessage(messageId: number, actorId: number): Promise<Message> {
        const message = await this.messagesRepository.findOne({
            where: { id: messageId },
            relations: ['sender', 'receiver', 'sender.rank', 'receiver.rank', 'parentMessage', 'parentMessage.sender'],
        });

        if (!message) {
            throw new NotFoundException('Message not found.');
        }
        if (message.sender_id !== actorId) {
            throw new ForbiddenException('You can only delete your own messages.');
        }

        message.is_deleted = true;
        message.content = 'This message was deleted.';
        return this.messagesRepository.save(message);
    }
}

