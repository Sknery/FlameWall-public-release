import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToMany, Tree, TreeChildren, TreeParent
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { Vote } from '../../votes/entities/vote.entity';
import { Expose } from 'class-transformer';


@Entity('comments')
@Tree('closure-table')
export class Comment {

  @PrimaryGeneratedColumn()
  id: number;


  @Column({ length: 1000 })
  content: string;


  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User;


  @Column({ name: 'author_id', nullable: true })
  authorId: number;


  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;


  @Column({ name: 'post_id' })
  postId: number;


  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;


  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;


  @TreeParent({ onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment;


  @Column({ name: 'parent_id', nullable: true })
  parentId: number | null;


  @TreeChildren()
  children: Comment[];


  @OneToMany(() => Vote, (vote) => vote.comment)
  votes: Vote[];


  @Expose()
  get childrenCount(): number {
    return this.children?.length || 0;
  }
}
