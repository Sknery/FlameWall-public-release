import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Clan } from './clan.entity';
import { User } from '../../users/entities/user.entity';


export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}


@Entity('clan_invitations')
@Index(['clan_id', 'invitee_id'], { where: "status = 'pending'", unique: true })
export class ClanInvitation {

  @PrimaryGeneratedColumn()
  id: number;


  @Column()
  clan_id: number;


  @Column()
  inviter_id: number;


  @Column()
  invitee_id: number;


  @ManyToOne(() => Clan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_id' })
  clan: Clan;


  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviter_id' })
  inviter: User;


  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitee_id' })
  invitee: User;


  @Column({ type: 'enum', enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;


  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;


  @Column({ name: 'expires_at' })
  expires_at: Date;
}
