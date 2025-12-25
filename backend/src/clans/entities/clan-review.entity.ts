import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Clan } from './clan.entity';
import { User } from '../../users/entities/user.entity';


@Entity('clan_reviews')
export class ClanReview {

  @PrimaryGeneratedColumn()
  id: number;


  @Column()
  clan_id: number;


  @ManyToOne(() => Clan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_id' })
  clan: Clan;


  @Column({ nullable: true })
  author_id: number | null;


  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User | null;


  @Column({ type: 'smallint' })
  rating: number;


  @Column({ type: 'text' })
  text: string;


  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
