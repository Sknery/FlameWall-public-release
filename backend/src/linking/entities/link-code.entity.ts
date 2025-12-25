import { User } from '../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';


@Entity('link_codes')
export class LinkCode {

  @PrimaryGeneratedColumn()
  id: number;


  @Index({ unique: true })
  @Column({ type: 'varchar', length: 10 })
  code: string;


  @Column({ name: 'user_id' })
  userId: number;


  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;


  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;


  @Column({ name: 'expires_at', type: 'timestamp' })
  expires_at: Date;
}
