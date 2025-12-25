import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, TreeRepository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';


@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: TreeRepository<Comment>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private readonly eventEmitter: EventEmitter2,
  ) { }


  async create(createCommentDto: CreateCommentDto, author: User): Promise<Comment> {
    const { content, postId, parentId } = createCommentDto;
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) throw new NotFoundException(`Post with ID ${postId} not found`);

    const comment = this.commentsRepository.create({
      content,
      postId,
      authorId: (author as any).userId,
    });

    if (parentId) {
      const parentComment = await this.commentsRepository.findOneBy({ id: parentId });
      if (!parentComment) throw new NotFoundException(`Parent comment with ID ${parentId} not found`);
      comment.parent = parentComment;
    }

    const savedComment = await this.commentsRepository.save(comment);
    this.eventEmitter.emit('comment.created', { authorId: author.id });

    return this.commentsRepository.findOneOrFail({
      where: { id: savedComment.id },
      relations: ['author', 'author.rank'],
    });
  }


  async findAllForPost(postId: number): Promise<Comment[]> {
    const postExists = await this.postRepository.findOneBy({ id: postId });
    if (!postExists) throw new NotFoundException(`Post with ID ${postId} not found`);

    const allComments = await this.commentsRepository.find({
      where: { postId },
      relations: ['author', 'author.rank', 'votes', 'votes.voter'],
      order: { createdAt: 'ASC' },
    });

    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];

    allComments.forEach(comment => {
      comment.children = [];
      commentMap.set(comment.id, comment);
    });

    allComments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }


  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['author', 'author.rank'],
    });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }


  async update(id: number, updateCommentDto: UpdateCommentDto, user: User): Promise<Comment> {
    const comment = await this.findOne(id);
    const canManage = user?.rank?.power_level >= 800 || comment.authorId === (user as any).userId;
    if (!canManage) {
      throw new ForbiddenException('You are not allowed to edit this comment');
    }
    Object.assign(comment, updateCommentDto);
    return this.commentsRepository.save(comment);
  }


  async remove(id: number, user: User): Promise<void> {
    const comment = await this.findOne(id);
    const canManage = user?.rank?.power_level >= 800 || comment.authorId === (user as any).userId;
    if (!canManage) {
      throw new ForbiddenException('You are not allowed to delete this comment');
    }
    await this.commentsRepository.remove(comment);
  }
}
