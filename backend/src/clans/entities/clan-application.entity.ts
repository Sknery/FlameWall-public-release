import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Clan } from './clan.entity';
import { User } from '../../users/entities/user.entity';


export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}


@Entity('clan_applications')
@Index(['clan_id', 'user_id'], { unique: true, where: "status = 'pending'" })
export class ClanApplication {

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


  @Column({ type: 'jsonb' })
  answers: Record<string, any>;


  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status: ApplicationStatus;


  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
