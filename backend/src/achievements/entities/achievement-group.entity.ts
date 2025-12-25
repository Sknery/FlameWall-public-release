

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Achievement } from './achievement.entity';


@Entity('achievement_groups')
export class AchievementGroup {

  @PrimaryGeneratedColumn()
  id: number;


  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;


  @Column({ type: 'text', nullable: true })
  description: string | null;


  @Column({ type: 'varchar', length: 255, name: 'icon_url', nullable: true })
  icon_url: string | null;


  @Column({ type: 'int', default: 0 })
  display_order: number;


  @OneToMany(() => Achievement, (achievement) => achievement.group)
  achievements: Achievement[];
}