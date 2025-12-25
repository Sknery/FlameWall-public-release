import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';


@Entity('global_messages')
export class GlobalMessage {

  @PrimaryGeneratedColumn()
  id: number;


  @Column({ type: 'text' })
  content: string;


  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;


  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User | null;


  @Column({ name: 'author_id', nullable: true })
  author_id: number | null;


  @ManyToOne(() => GlobalMessage, (message) => message.replies, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: GlobalMessage | null;


  @Column({ name: 'parent_id', nullable: true })
  parent_id: number | null;


  @OneToMany(() => GlobalMessage, (message) => message.parent)
  replies: GlobalMessage[];
}
