import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity('votes')
@Index(['voter', 'post'], { unique: true, where: '"post_id" IS NOT NULL' })
@Index(['voter', 'comment'], { unique: true, where: '"comment_id" IS NOT NULL' })
@Check(`("post_id" IS NOT NULL AND "comment_id" IS NULL) OR ("post_id" IS NULL AND "comment_id" IS NOT NULL)`)
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  value: number;

  @ManyToOne(() => User, (user) => user.votes, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'voter_id' })
  voter: User;

  @ManyToOne(() => Post, (post) => post.votes, {    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'post_id' })
  post: Post | null;

  @ManyToOne(() => Comment, (comment) => comment.votes, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment | null;
}