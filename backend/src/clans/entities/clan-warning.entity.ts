import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Clan } from './clan.entity';
import { User } from '../../users/entities/user.entity';


@Entity('clan_warnings')
export class ClanWarning {

  @PrimaryGeneratedColumn()
  id: number;


  @Column()
  clan_id: number;


  @Column()
  actor_id: number;


  @Column()
  target_id: number;


  @ManyToOne(() => Clan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_id' })
  clan: Clan;


  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User;


  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  target: User;


  @Column({ type: 'text' })
  reason: string;


  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
