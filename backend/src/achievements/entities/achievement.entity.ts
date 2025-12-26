

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AchievementProgress } from './achievement-progress.entity';
import { AchievementGroup } from './achievement-group.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255, name: 'icon_url', nullable: true })
  icon_url: string | null;

  @Column({ type: 'varchar', length: 7, name: 'card_color', nullable: true, default: '#32383E' })
  card_color: string | null;

  @Column({ type: 'varchar', length: 7, name: 'text_color', nullable: true, default: '#F0F4F8' })
  text_color: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_enabled' })
  is_enabled: boolean;

  @Column({ type: 'text', name: 'reward_command', nullable: true })
  reward_command: string | null;

  @Column({ type: 'integer', name: 'reward_coins', nullable: true, default: 0 })
  reward_coins: number | null;

  @Column({ type: 'jsonb' })
  conditions: Record<string, any>;

  @Column({ name: 'group_id', nullable: true })
  group_id: number | null;

  @ManyToOne(() => AchievementGroup, (group) => group.achievements, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'group_id' })
  group: AchievementGroup | null;

  @Column({ name: 'parent_id', nullable: true })
  parent_id: number | null;

  @ManyToOne(() => Achievement, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Achievement | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => AchievementProgress, (progress) => progress.achievement)
  progress_entries: AchievementProgress[];
}