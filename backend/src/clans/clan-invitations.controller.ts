
import { Controller, Post, Get, Body, Param, ParseIntPipe, UseGuards, Request, HttpCode, HttpStatus, NotFoundException, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClansService } from './clans.service';
import { InviteMemberDto } from './dto/invite-member.dto';


@ApiTags('Clans / Invitations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class ClanInvitationsController {
    constructor(private readonly clansService: ClansService) { }


    @Get('clan-invitations/pending')
    @ApiOperation({ summary: 'Get my pending clan invitations' })
    getMyInvitations(@Request() req) {
        return this.clansService.getMyInvitations(req.user.userId);
    }


    @Get('clans/:clanId/invitations/sent')
    @ApiOperation({ summary: 'Get all pending invitations sent by a clan (for managers)' })
    getSentInvitations(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Request() req,
    ) {
        return this.clansService.getSentInvitations(clanId, req.user.userId);
    }


    @Post('clans/:clanId/invitations')
    @ApiOperation({ summary: 'Invite a user to a clan' })
    inviteMember(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Body() dto: InviteMemberDto,
        @Request() req,
    ) {
        return this.clansService.inviteMember(clanId, req.user.userId, dto);
    }


    @Delete('clans/:clanId/invitations/:invitationId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Cancel a pending invitation (for managers)' })
    cancelInvitation(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Param('invitationId', ParseIntPipe) invitationId: number,
        @Request() req,
    ) {
        return this.clansService.cancelInvitation(clanId, invitationId, req.user.userId);
    }


    @Post('clan-invitations/:invitationId/:action')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Accept or decline a clan invitation' })
    handleInvitation(
        @Param('invitationId', ParseIntPipe) invitationId: number,
        @Param('action') action: 'accept' | 'decline',
        @Request() req,
    ) {
        if (action !== 'accept' && action !== 'decline') {
            throw new NotFoundException();
        }
        return this.clansService.handleInvitation(invitationId, req.user.userId, action);
    }
}
