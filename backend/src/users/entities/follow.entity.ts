import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';


@Entity('follows')
export class Follow {

  @PrimaryColumn({ name: 'follower_id' })
  follower_id: number;


  @PrimaryColumn({ name: 'following_id' })
  following_id: number;


  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: User;


  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: User;


  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
