import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, Column } from 'typeorm';
import { Clan } from './clan.entity';
import { User } from '../../users/entities/user.entity';
import { ClanRole } from './clan-role.entity';


@Entity('clan_members')
@Index(['clan', 'user'], { unique: true })
export class ClanMember {

  @PrimaryGeneratedColumn()
  id: number;


  @Column()
  clan_id: number;


  @Column()
  user_id: number;


  @Column()
  role_id: number;


  @ManyToOne(() => Clan, (clan) => clan.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_id' })
  clan: Clan;


  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;


  @ManyToOne(() => ClanRole, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: ClanRole | null;


  @Column({ type: 'boolean', default: false, name: 'is_muted' })
  is_muted: boolean;


  @Column({ type: 'timestamp', name: 'mute_expires_at', nullable: true })
  mute_expires_at: Date | null;
}
