import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRanks } from '../ranks/ranks.service';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddReplyDto } from './dto/add-reply.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketStatus, TicketCategory } from './entities/support-ticket.entity';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  async createTicket(@Body() createTicketDto: CreateTicketDto, @Request() req: any) {
    return this.supportService.createTicket(
      req.user.userId,
      createTicketDto.subject,
      createTicketDto.message,
      createTicketDto.category,
      createTicketDto.priority,
      createTicketDto.reportEntityType,
      createTicketDto.reportEntityId,
      createTicketDto.reportEntityData,
    );
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get support tickets' })
  async getTickets(
    @Request() req: any,
    @Query('status') status?: TicketStatus,
    @Query('category') category?: TicketCategory,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    // Regular users can only see their own tickets
    const userId = req.user.userId;
    const isAdmin = req.user.rank?.power_level >= SystemRanks.MODERATOR.power_level;
    
    return this.supportService.getTickets(
      isAdmin ? undefined : userId,
      status,
      category,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Get('tickets/my')
  @ApiOperation({ summary: 'Get current user tickets' })
  async getMyTickets(@Request() req: any) {
    return this.supportService.getUserTickets(req.user.userId);
  }

  @Post('tickets/:id/reply')
  @UseGuards(RolesGuard)
  @Roles(SystemRanks.MODERATOR.power_level)
  @ApiOperation({ summary: 'Add reply to ticket (moderators only)' })
  async addReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() addReplyDto: AddReplyDto,
    @Request() req: any,
  ) {
    const isAdmin = req.user.rank?.power_level >= SystemRanks.MODERATOR.power_level;
    return this.supportService.addReply(
      id,
      req.user.userId,
      addReplyDto.message,
      addReplyDto.isInternal && isAdmin ? true : false,
      isAdmin, // Pass isAdmin flag so service can access any ticket
    );
  }

  @Post('tickets/:id/user-reply')
  @ApiOperation({ summary: 'Add reply to own ticket (ticket owner only)' })
  @ApiResponse({ status: 200, description: 'Reply added successfully' })
  async addUserReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() addReplyDto: AddReplyDto,
    @Request() req: any,
  ) {
    // Users can only reply to their own tickets
    return this.supportService.addReply(
      id,
      req.user.userId,
      addReplyDto.message,
      false,
      false, // Not admin, so will check ownership
    );
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async getTicketById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const isAdmin = req.user.rank?.power_level >= SystemRanks.MODERATOR.power_level;
    return this.supportService.getTicketById(id, isAdmin ? undefined : req.user.userId);
  }

  @Post('tickets/:id/reopen')
  @ApiOperation({ summary: 'Reopen a resolved ticket (ticket owner only)' })
  @ApiResponse({ status: 200, description: 'Ticket reopened successfully' })
  async reopenTicket(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.supportService.reopenTicket(id, req.user.userId);
  }

  @Patch('tickets/:id')
  @UseGuards(RolesGuard)
  @Roles(SystemRanks.MODERATOR.power_level)
  @ApiOperation({ summary: 'Update ticket (admin only)' })
  async updateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTicketDto,
  ) {
    if (updateDto.status !== undefined) {
      return this.supportService.updateTicketStatus(
        id,
        updateDto.status,
        updateDto.assignedToId,
      );
    }
    if (updateDto.priority !== undefined) {
      return this.supportService.updateTicketPriority(id, updateDto.priority);
    }
    if (updateDto.assignedToId !== undefined) {
      const ticket = await this.supportService.getTicketById(id);
      return this.supportService.updateTicketStatus(
        ticket.id,
        ticket.status,
        updateDto.assignedToId,
      );
    }
    // If no updates provided, return current ticket
    return this.supportService.getTicketById(id);
  }
}

