import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Clan } from '../../clans/entities/clan.entity';

export enum ReportType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  USER = 'USER',
  CLAN = 'CLAN',
  MESSAGE = 'MESSAGE',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum ReportReason {
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  COPYRIGHT_VIOLATION = 'COPYRIGHT_VIOLATION',
  FAKE_INFORMATION = 'FAKE_INFORMATION',
  OTHER = 'OTHER',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ReportType })
  type: ReportType;

  @Column({ name: 'target_id' })
  targetId: number;

  @Column({ name: 'reporter_id' })
  reporterId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User | null;

  @Column({ type: 'text', nullable: true, name: 'admin_notes' })
  adminNotes: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt: Date | null;

  // Relations to target entities (optional, for easier querying)
  @ManyToOne(() => Post, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  post?: Post | null;

  @ManyToOne(() => Comment, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  comment?: Comment | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  reportedUser?: User | null;

  @ManyToOne(() => Clan, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  clan?: Clan | null;
}

