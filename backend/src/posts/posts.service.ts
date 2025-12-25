

import { Injectable, NotFoundException, ForbiddenException, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In, DataSource } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/entities/user.entity';
import { FindAllPostsDto } from './dto/find-all-posts';
import { SystemRanks } from '../ranks/ranks.service';
import { EventsService } from '../events/events.service';
const DOMPurify = require('dompurify');
import { JSDOM } from 'jsdom';
import { CommentsService } from '../comments/comments.service';
import { Vote } from '../votes/entities/vote.entity';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private domPurify;

  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly eventsService: EventsService,
    @Inject(forwardRef(() => CommentsService))
    private readonly commentsService: CommentsService,
    private readonly dataSource: DataSource,
  ) {
      const window = new JSDOM('').window;
      this.domPurify = DOMPurify(window);
  }

   async create(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) {
      this.logger.error(`[CREATE-FAIL] ❌ Author with ID ${authorId} not found. Cannot create post.`);
      throw new ForbiddenException('User not found or not authorized to create a post.');
    }

    const sanitizedContent = this.domPurify.sanitize(createPostDto.content, {
      FORBID_TAGS: ['style'],
      FORBID_ATTR: ['style']
    }).replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
    const post = this.postsRepository.create({ ...createPostDto, content: sanitizedContent, author });
    const savedPost = await this.postsRepository.save(post);
    this.logger.log(`[CREATE-SUCCESS] ✅ User ID: ${authorId} created Post ID: ${savedPost.id}.`);
    const totalPosts = await this.postsRepository.count({ where: { author_id: authorId }});
    this.eventsService.triggerWebsiteEvent('POST_CREATED', authorId, { value: totalPosts });
    return savedPost;
  }

  async findAll(queryDto: FindAllPostsDto, currentUserId?: number): Promise<{ data: any[], total: number }> {
    const { sortBy = 'created_at', order = 'DESC', search, page = 1, limit = 10 } = queryDto;
    this.logger.verbose(`[DB-QUERY] 💾 Executing OPTIMIZED findAll. Page: ${page}, Limit: ${limit}, SortBy: ${sortBy}, Order: ${order}, Search: ${search || 'none'}`);

    const queryBuilder = this.postsRepository.createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('author.rank', 'rank')
        .loadRelationCountAndMap('post.commentCount', 'post.comments');

    if (search) {
        queryBuilder.where('post.title ILIKE :search', { search: `%${search}%` });
    }

    const total = await queryBuilder.getCount();

    if (sortBy === 'score') {


      const allPostIdsQuery = this.postsRepository.createQueryBuilder('post')
          .select('post.id')
          .leftJoin('post.votes', 'vote')
          .addSelect('COALESCE(SUM(vote.value), 0)', 'score')
          .groupBy('post.id')
          .orderBy('score', order as 'ASC' | 'DESC')
          .addOrderBy('post.created_at', 'DESC');

      if (search) {
          allPostIdsQuery.where('post.title ILIKE :search', { search: `%${search}%` });
      }

      const allSortedIds = await allPostIdsQuery.getRawMany();
      const paginatedIds = allSortedIds.slice((page - 1) * limit, page * limit).map(p => p.post_id);

      if (paginatedIds.length === 0) return { data: [], total };

      queryBuilder.whereInIds(paginatedIds);

    } else {
        queryBuilder.orderBy(`post.${sortBy}`, order as 'ASC' | 'DESC');
        queryBuilder.skip((page - 1) * limit).take(limit);
    }

    const posts = await queryBuilder.getMany();

    if (posts.length === 0) {
        return { data: [], total };
    }

    const postIds = posts.map(p => p.id);
    const votes = await this.dataSource.getRepository(Vote).find({
        where: { post: { id: In(postIds) } },
        relations: ['voter', 'post'],
    });

    const votesMap = new Map<number, Vote[]>();
    votes.forEach(vote => {
        const postId = (vote as any).post?.id;
        if (postId) {
            if (!votesMap.has(postId)) { votesMap.set(postId, []); }
            votesMap.get(postId)!.push(vote);
        }
    });

    let data = posts.map(post => {
        const postVotes = votesMap.get(post.id) || [];
        const score = postVotes.reduce((acc, vote) => acc + vote.value, 0);
        const currentUserVoteObj = currentUserId ? postVotes.find(v => v.voter?.id === currentUserId) : null;
        const currentUserVote = currentUserVoteObj ? currentUserVoteObj.value : 0;

        return {
            ...post,
            score,
            currentUserVote,
        };
    });

    if (sortBy === 'score') {

      data.sort((a, b) => {
        const aIndex = postIds.indexOf(a.id);
        const bIndex = postIds.indexOf(b.id);
        return aIndex - bIndex;
      });
    }

    this.logger.verbose(`[DB-RESULT] 💾 Найдено ${total} постов, возвращено ${data.length} с подсчетами.`);
    return { data, total };
  }

  async findAllForAdmin(queryDto: FindAllPostsDto): Promise<{ data: Post[], total: number }> {
    const { search, page = 1, limit = 15 } = queryDto;
    this.logger.verbose(`[ADMIN-DB-QUERY] 💾 Executing LIGHTWEIGHT findAll for admin with page: ${page}, limit: ${limit}, search: ${search || 'none'}`);

    const whereOptions = search ? { title: ILike(`%${search}%`) } : {};

    const [entities, total] = await this.postsRepository.findAndCount({
        where: whereOptions,
        relations: ['author', 'author.rank'],
        order: { created_at: 'DESC' },
        take: limit,
        skip: (page - 1) * limit,
    });

    this.logger.verbose(`[ADMIN-DB-RESULT] 💾 Found ${total} total posts, returning ${entities.length}.`);
    return { data: entities, total };
  }


  async findOne(id: number, userId?: number): Promise<any> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'author.rank', 'votes', 'votes.voter'],
    });

    if (!post) {
      this.logger.warn(`[GET-ONE-FAIL] ⚠️ Post with ID ${id} not found.`);
      throw new NotFoundException(`Post with ID ${id} not found.`);
    }

    const commentsTree = await this.commentsService.findAllForPost(id);
    const mapVotes = (entity: any, currentUserId?: number): any => {
      if (!entity) return null;
      const newEntity = { ...entity };
      const hasVotes = newEntity.votes && Array.isArray(newEntity.votes);
      newEntity.likes = hasVotes ? newEntity.votes.filter(v => v.value === 1).length : 0;
      newEntity.dislikes = hasVotes ? newEntity.votes.filter(v => v.value === -1).length : 0;
      const vote = (currentUserId && hasVotes) ? newEntity.votes.find(v => v.voter?.id === currentUserId) : null;
      newEntity.currentUserVote = vote ? vote.value : 0;
      newEntity.score = newEntity.likes - newEntity.dislikes;
      delete newEntity.votes;
      return newEntity;
    };
    const mapCommentTreeVotes = (comments, currentUserId?: number): any[] => {
      if (!comments || comments.length === 0) return [];

      return comments.map(comment => {
        const processedChildren = (comment.children && comment.children.length > 0)
          ? mapCommentTreeVotes(comment.children, currentUserId)
          : [];

        const commentWithVotes = mapVotes(comment, currentUserId);
        commentWithVotes.children = processedChildren;

        return commentWithVotes;
      });
    };

    const postWithVotes = mapVotes(post, userId);
    postWithVotes.comments = mapCommentTreeVotes(commentsTree, userId);

    return postWithVotes;
  }

   async update(id: number, updatePostDto: UpdatePostDto, userId: number): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id }, relations: ['author'] });
    if (!post) {
      this.logger.warn(`[UPDATE-FAIL] ⚠️ Post with ID: ${id} not found for update attempt by User ID: ${userId}.`);
      throw new NotFoundException(`Post with ID ${id} not found.`);
    }

    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['rank'] });
    if (!user) {
      this.logger.error(`[UPDATE-FAIL] ❌ User performing update action not found. User ID: ${userId}`);
      throw new ForbiddenException('User performing the action not found.');
    }

    const isAuthor = post.author_id === userId;
    const canManagePosts = user.rank && user.rank.power_level >= SystemRanks.MODERATOR.power_level;

    if (!isAuthor && !canManagePosts) {
      this.logger.warn(`[UPDATE-FORBIDDEN] 🚫 User ID: ${userId} (Rank: ${user.rank?.name}) failed to update Post ID: ${id}. Reason: Not author or moderator.`);
      throw new ForbiddenException('You are not authorized to update this post.');
    }

    if (updatePostDto.content) {
        updatePostDto.content = this.domPurify.sanitize(updatePostDto.content, {
          FORBID_TAGS: ['style'],
          FORBID_ATTR: ['style']
        }).replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
    }

    await this.postsRepository.update(id, updatePostDto);
    this.logger.log(`[UPDATE-SUCCESS] ✅ Post ID: ${id} updated by User ID: ${userId}.`);
    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const post = await this.postsRepository.findOne({ where: { id }, relations: ['author'] });
    if (!post) {
      this.logger.warn(`[DELETE-FAIL] ⚠️ Post with ID: ${id} not found for delete attempt by User ID: ${userId}.`);
      throw new NotFoundException(`Post with ID ${id} not found.`);
    }

    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['rank'] });
    if (!user) {
      this.logger.error(`[DELETE-FAIL] ❌ User performing delete action not found. User ID: ${userId}`);
      throw new ForbiddenException('User performing the action not found.');
    }

    const isAuthor = post.author_id === userId;
    const canManagePosts = user.rank && user.rank.power_level >= SystemRanks.MODERATOR.power_level;

    if (!isAuthor && !canManagePosts) {
      this.logger.warn(`[DELETE-FORBIDDEN] 🚫 User ID: ${userId} (Rank: ${user.rank?.name}) failed to delete Post ID: ${id}. Reason: Not author or moderator.`);
      throw new ForbiddenException('You are not authorized to delete this post.');
    }

    await this.postsRepository.remove(post);
    this.logger.warn(`[DELETE-SUCCESS] ✅ Post ID: ${id} was deleted by User ID: ${userId}.`);
  }
}

