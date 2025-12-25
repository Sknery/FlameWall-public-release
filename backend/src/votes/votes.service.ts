

import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Vote } from './entities/vote.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { EventsService } from '../events/events.service';
@Injectable()
export class VotesService {
  private readonly logger = new Logger(VotesService.name);

  constructor(
    @InjectRepository(Vote)
    private votesRepository: Repository<Vote>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private dataSource: DataSource,
        private readonly eventsService: EventsService
  ) { }

  async castVote(
    voterId: number,
    targetType: 'post' | 'comment',
    targetId: number,
    value: number,
  ) {
    return this.dataSource.transaction(async (manager) => {
      this.logger.verbose(`[VOTE-TX-START] 🗳️  User ID: ${voterId} casting vote on ${targetType} ID: ${targetId} (Value: ${value}).`);

      let target: Post | Comment | null;

      if (targetType === 'post') {
        target = await manager.findOne(Post, { where: { id: targetId }, relations: ['author'] });
      } else {
        target = await manager.findOne(Comment, { where: { id: targetId }, relations: ['author'] });
      }

      if (!target) {
        this.logger.warn(`[VOTE-FAIL] ⚠️  Target ${targetType} with ID ${targetId} not found.`);
        throw new NotFoundException(`${targetType} with ID ${targetId} not found.`);
      }

      if (!target.author) {
        this.logger.error(`[VOTE-FAIL] ❌ Author for ${targetType} with ID ${targetId} not found. Content seems orphaned.`);
        throw new NotFoundException(`Author for ${targetType} with ID ${targetId} not found.`);
      }
      if (target.author.id === voterId) {
        this.logger.warn(`[VOTE-DENIED] 🚫 User ID: ${voterId} attempted to vote for their own ${targetType} (ID: ${targetId}).`);
        throw new ForbiddenException('You cannot vote for your own content.');
      }

      const author = target.author;
      const existingVote = await manager.findOne(Vote, {
        where: { voter: { id: voterId }, [targetType]: { id: targetId } },
      });

      let reputationChange = 0;

      if (existingVote) {
        if (existingVote.value === value) {
          this.logger.log(`[VOTE-REMOVE] 🗑️ User ID: ${voterId} is removing their vote from ${targetType} ID: ${targetId}.`);
          await manager.remove(Vote, existingVote);
          reputationChange = -value;
        } else {
          this.logger.log(`[VOTE-CHANGE] ↔️  User ID: ${voterId} is changing their vote on ${targetType} ID: ${targetId} from ${existingVote.value} to ${value}.`);
          reputationChange = value - existingVote.value;
          existingVote.value = value;
          await manager.save(Vote, existingVote);
        }
      } else {
        this.logger.log(`[VOTE-NEW] ✨ User ID: ${voterId} is casting a new vote on ${targetType} ID: ${targetId}.`);
        const newVote = manager.create(Vote, { voter: { id: voterId }, [targetType]: { id: targetId }, value });
        await manager.save(Vote, newVote);
        reputationChange = value;
      }

       if (reputationChange !== 0) {
            this.logger.log(`[VOTE-REPUTATION] 📈 Updating reputation for author ID: ${author.id} by ${reputationChange}.`);
            await manager.increment(User, { id: author.id }, 'reputation_count', reputationChange);

            this.eventsService.triggerWebsiteEvent(
                'REPUTATION_CHANGED',
                author.id,
                { value: reputationChange }
            );
        }

      const votes = await manager.find(Vote, { where: { [targetType]: { id: targetId } } });
      const likes = votes.filter(v => v.value === 1).length;
      const dislikes = votes.filter(v => v.value === -1).length;

      this.logger.log(`[VOTE-TX-SUCCESS] ✅ Vote transaction for ${targetType} ID: ${targetId} completed. New score: ${likes - dislikes}`);
      return { likes, dislikes };


    });


  }
}