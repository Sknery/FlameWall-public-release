import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Clan } from './clan.entity';


interface ClanPermissions {
  canEditDetails: boolean;
  canEditAppearance: boolean;
  canEditRoles: boolean;
  canEditApplicationForm: boolean;
  canAcceptMembers: boolean;
  canInviteMembers: boolean;
  canUseClanTags: boolean;
  canAccessAdminChat: boolean;
}


interface MemberPermissions {
  maxKickPower: number;
  maxMutePower: number;
  maxPromotePower: number;
  maxDemotePower: number;
  maxWarnPower: number;
}


@Entity('clan_roles')
export class ClanRole {

  @PrimaryGeneratedColumn()
  id: number;


  @Column()
  clan_id: number;


  @ManyToOne(() => Clan, (clan) => clan.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_id' })
  clan: Clan;


  @Column({ length: 50 })
  name: string;


  @Column({ type: 'varchar', length: 7, default: '#AAAAAA' })
  color: string;


  @Column({ default: 1 })
  power_level: number;


  @Column({ type: 'jsonb' })
  permissions: {
    clanPermissions: ClanPermissions,
    memberPermissions: MemberPermissions,
  };


  @Column({ default: false })
  is_system_role: boolean;
}
