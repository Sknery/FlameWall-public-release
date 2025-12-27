import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SupportTicket,
  SupportTicketReply,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from './entities/support-ticket.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(SupportTicket)
    private ticketsRepository: Repository<SupportTicket>,
    @InjectRepository(SupportTicketReply)
    private repliesRepository: Repository<SupportTicketReply>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async createTicket(
    userId: number,
    subject: string,
    message: string,
    category: TicketCategory,
    priority: TicketPriority = TicketPriority.MEDIUM,
    reportEntityType?: string,
    reportEntityId?: number,
    reportEntityData?: string,
  ): Promise<SupportTicket> {
    const ticket = this.ticketsRepository.create({
      userId,
      subject,
      message,
      category,
      priority,
      status: TicketStatus.OPEN,
      reportEntityType: reportEntityType || null,
      reportEntityId: reportEntityId || null,
      reportEntityData: reportEntityData || null,
    });

    const savedTicket = await this.ticketsRepository.save(ticket);
    this.logger.log(`[TICKET-CREATE] User ${userId} created ticket ${savedTicket.id}: ${subject}${reportEntityType ? ` (Report: ${reportEntityType}:${reportEntityId})` : ''}`);
    
    return savedTicket;
  }

  async getTickets(
    userId?: number,
    status?: TicketStatus,
    category?: TicketCategory,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ tickets: SupportTicket[]; total: number }> {
    const queryBuilder = this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
      .leftJoinAndSelect('ticket.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser')
      .orderBy('ticket.createdAt', 'DESC');

    if (userId) {
      queryBuilder.andWhere('ticket.userId = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('ticket.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere('ticket.category = :category', { category });
    }

    const [tickets, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { tickets, total };
  }

  async getTicketById(id: number, userId?: number): Promise<SupportTicket> {
    const queryBuilder = this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
      .leftJoinAndSelect('ticket.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser')
      .where('ticket.id = :id', { id });

    if (userId) {
      // Users can only see their own tickets unless they're admins
      queryBuilder.andWhere('ticket.userId = :userId', { userId });
    }

    const ticket = await queryBuilder.getOne();

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async addReply(
    ticketId: number,
    userId: number,
    message: string,
    isInternal: boolean = false,
    isAdmin: boolean = false,
  ): Promise<SupportTicketReply> {
    // Admins can access any ticket, regular users can only access their own
    const ticket = await this.getTicketById(ticketId, isAdmin ? undefined : userId);

    // Get the user who is replying (moderator/admin)
    const replyingUser = await this.usersRepository.findOne({ where: { id: userId } });
    if (!replyingUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update ticket status
    if (!isInternal) {
      // If admin/moderator is replying to someone else's ticket, mark as RESOLVED
      if (isAdmin && ticket.userId !== userId) {
        ticket.status = TicketStatus.RESOLVED;
        ticket.resolvedAt = new Date();
      } else if (ticket.status === TicketStatus.RESOLVED) {
        // If user replies to resolved ticket, reopen it
        ticket.status = TicketStatus.WAITING_RESPONSE;
        ticket.resolvedAt = null;
      } else if (ticket.userId === userId && !isAdmin) {
        // If ticket owner is replying, change status to IN_PROGRESS to notify moderators
        if (ticket.status === TicketStatus.WAITING_RESPONSE) {
          ticket.status = TicketStatus.IN_PROGRESS;
        }
      } else if (ticket.status === TicketStatus.IN_PROGRESS) {
        ticket.status = TicketStatus.WAITING_RESPONSE;
      } else {
        ticket.status = TicketStatus.IN_PROGRESS;
      }
      await this.ticketsRepository.save(ticket);
    }

    const reply = this.repliesRepository.create({
      ticketId,
      userId,
      message,
      isInternal,
    });

    const savedReply = await this.repliesRepository.save(reply);
    this.logger.log(`[TICKET-REPLY] User ${userId} replied to ticket ${ticketId}`);

    // Send notification to ticket owner if reply is not internal
    if (!isInternal && ticket.userId !== userId) {
      const ticketOwner = await this.usersRepository.findOne({ where: { id: ticket.userId } });
      if (ticketOwner) {
        await this.notificationsService.createNotification(
          ticketOwner,
          'New Reply to Your Support Ticket',
          `${replyingUser.username} replied to your ticket: "${ticket.subject}"`,
          'support_ticket_reply',
          `/support?ticket=${ticketId}`,
        );
        this.logger.log(`[TICKET-REPLY] Notification sent to ticket owner (User ID: ${ticket.userId})`);
      }
    }

    return savedReply;
  }

  async updateTicketStatus(
    ticketId: number,
    status: TicketStatus,
    assignedToId?: number,
  ): Promise<SupportTicket> {
    const ticket = await this.getTicketById(ticketId);

    ticket.status = status;

    if (assignedToId) {
      const assignedUser = await this.usersRepository.findOne({ where: { id: assignedToId } });
      if (!assignedUser) {
        throw new NotFoundException(`User with ID ${assignedToId} not found`);
      }
      ticket.assignedToId = assignedToId;
    }

    if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
      ticket.resolvedAt = new Date();
    }

    const updatedTicket = await this.ticketsRepository.save(ticket);
    this.logger.log(`[TICKET-UPDATE] Ticket ${ticketId} status changed to ${status}`);

    return updatedTicket;
  }

  async updateTicketPriority(
    ticketId: number,
    priority: TicketPriority,
  ): Promise<SupportTicket> {
    const ticket = await this.getTicketById(ticketId);
    ticket.priority = priority;
    return this.ticketsRepository.save(ticket);
  }

  async getUserTickets(userId: number): Promise<SupportTicket[]> {
    return this.ticketsRepository.find({
      where: { userId },
      relations: ['assignedTo', 'replies', 'replies.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async reopenTicket(ticketId: number, userId: number): Promise<SupportTicket> {
    const ticket = await this.getTicketById(ticketId, userId);
    
    if (ticket.status !== TicketStatus.RESOLVED) {
      throw new BadRequestException('Only resolved tickets can be reopened');
    }

    if (ticket.userId !== userId) {
      throw new BadRequestException('You can only reopen your own tickets');
    }

    ticket.status = TicketStatus.WAITING_RESPONSE;
    ticket.resolvedAt = null;
    
    const updatedTicket = await this.ticketsRepository.save(ticket);
    this.logger.log(`[TICKET-REOPEN] User ${userId} reopened ticket ${ticketId}`);
    
    return updatedTicket;
  }
}

