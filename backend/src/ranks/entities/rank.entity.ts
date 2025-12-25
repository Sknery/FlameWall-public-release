

import { User } from '../../users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';

@Entity('ranks')
export class Rank {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  name: string;
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, name: 'system_name' })
  system_name: string;

  @Index({ unique: true })
  @Column({ type: 'int' })
  power_level: number;

  @Column({ type: 'varchar', length: 7, default: '#808080' })
  display_color: string;

  @Column({ type: 'boolean', default: true })
  is_removable: boolean;

  @Column({ type: 'varchar', length: 255, name: 'command_template', nullable: true })
  command_template: string | null;

  @Column({ type: 'varchar', length: 255, name: 'command_template_remove', nullable: true })
  command_template_remove: string | null;


  @Column({ type: 'boolean', default: false, name: 'is_site_only' })
  is_site_only: boolean;

  @OneToMany(() => User, (user) => user.rank)
  users: User[];
}
