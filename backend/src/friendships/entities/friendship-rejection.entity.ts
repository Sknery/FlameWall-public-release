import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';


@Entity('friendship_rejections')
@Unique(['rejector_id', 'requester_id'])
export class FriendshipRejection {

  @PrimaryGeneratedColumn()
  id: number;


  @Column({ name: 'rejector_id' })
  rejector_id: number;


  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rejector_id' })
  rejector: User;


  @Column({ name: 'requester_id' })
  requester_id: number;


  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;


  @CreateDateColumn({ name: 'rejected_at' })
  rejected_at: Date;
}
