import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ClanMember } from './clan-member.entity';
import { ClanRole } from './clan-role.entity';
import { ClanMessage } from './clan-message.entity';


export enum ClanJoinType {
  OPEN = 'open',
  APPLICATION = 'application',
  CLOSED = 'closed',
}


@Entity('clans')
export class Clan {

  @PrimaryGeneratedColumn()
  id: number;


  @Column({ length: 100 })
  name: string;


  @Index({ unique: true })
  @Column({ length: 50, unique: true })
  tag: string;


  @Column({ type: 'text', nullable: true })
  description: string | null;


  @Column({ name: 'card_image_url', type: 'varchar', length: 255, nullable: true })
  card_image_url: string | null;


  @Column({ name: 'card_icon_url', type: 'varchar', length: 255, nullable: true })
  card_icon_url: string | null;


  @Column({ name: 'card_color', type: 'varchar', length: 7, default: '#32383E' })
  card_color: string;


  @Column({ type: 'varchar', length: 7, name: 'text_color', nullable: true, default: '#F0F4F8' })
  text_color: string | null;


  @Column({
    type: 'enum',
    enum: ClanJoinType,
    default: ClanJoinType.CLOSED,
  })
  join_type: ClanJoinType;


  @Column({ type: 'jsonb', name: 'application_template', nullable: true })
  application_template: Record<string, any> | null;


  @Column({ name: 'owner_id' })
  owner_id: number;


  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;


  @OneToMany(() => ClanMessage, (message) => message.clan)
  messages: ClanMessage[];


  @OneToMany(() => ClanMember, (member) => member.clan)
  members: ClanMember[];


  @OneToMany(() => ClanRole, (role) => role.clan)
  roles: ClanRole[];


  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;


  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
