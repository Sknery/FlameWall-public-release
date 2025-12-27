import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_RESPONSE = 'WAITING_RESPONSE',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketCategory {
  TECHNICAL = 'TECHNICAL',
  PAYMENT = 'PAYMENT',
  ACCOUNT = 'ACCOUNT',
  GAME_ISSUE = 'GAME_ISSUE',
  SUGGESTION = 'SUGGESTION',
  OTHER = 'OTHER',
}

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 200 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: TicketCategory })
  category: TicketCategory;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'report_entity_type' })
  reportEntityType: string | null; // 'POST', 'COMMENT', 'NEWS', 'USER', etc.

  @Column({ type: 'int', nullable: true, name: 'report_entity_id' })
  reportEntityId: number | null; // ID of the reported entity

  @Column({ type: 'text', nullable: true, name: 'report_entity_data' })
  reportEntityData: string | null; // JSON string with entity data for preview

  @OneToMany(() => SupportTicketReply, (reply) => reply.ticket, { cascade: true })
  replies: SupportTicketReply[];
}

@Entity('support_ticket_replies')
export class SupportTicketReply {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ticket_id' })
  ticketId: number;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: SupportTicket;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false, name: 'is_internal' })
  isInternal: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

