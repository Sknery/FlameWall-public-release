import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Clan } from './clan.entity';
import { User } from '../../users/entities/user.entity';


@Entity('clan_member_history')
export class ClanMemberHistory {

  @PrimaryGeneratedColumn()
  id: number;


  @Column()
  clan_id: number;


  @Column()
  user_id: number;


  @ManyToOne(() => Clan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_id' })
  clan: Clan;


  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;


  @CreateDateColumn({ name: 'joined_at' })
  joined_at: Date;


  @Column({ type: 'timestamp', name: 'left_at', nullable: true })
  left_at: Date | null;
}
