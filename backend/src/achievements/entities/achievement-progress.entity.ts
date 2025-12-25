

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Achievement } from './achievement.entity';


@Entity('achievement_progress')
@Unique(['user_id', 'achievement_id'])
export class AchievementProgress {

  @PrimaryGeneratedColumn()
  id: number;


  @Column({ name: 'user_id' })
  user_id: number;


  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;


  @Column({ name: 'achievement_id' })
  achievement_id: number;


  @ManyToOne(() => Achievement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'achievement_id' })
  achievement: Achievement;


  @Column({ type: 'jsonb', default: {} })
  progress_data: Record<string, any>;


  @Column({ type: 'boolean', default: false, name: 'is_completed' })
  is_completed: boolean;


  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completed_at: Date | null;
}