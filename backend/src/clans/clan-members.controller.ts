
import { Controller, Delete, Param, ParseIntPipe, UseGuards, Request, HttpCode, HttpStatus, Patch, Body, ValidationPipe, Logger, Post, Get } from '@nestjs/common';
import { ClansService } from './clans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UpdateClanMemberDto } from './dto/update-clan-member.dto';
import { CreateClanWarningDto } from './dto/create-clan-warning.dto';
import { MuteClanMemberDto } from './dto/mute-clan-member.dto';
import { KickMemberDto } from './dto/kick-member.dto';


@ApiTags('Clans / Members')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('clans/:clanId/members')
export class ClanMembersController {
    private readonly logger = new Logger(ClanMembersController.name);

    constructor(private readonly clansService: ClansService) {
        this.logger.log('ClanMembersController has been initialized!');
    }


    @Patch(':memberId')
    @ApiOperation({ summary: 'Update a member\'s details (e.g., change role)' })
    changeMemberRole(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Param('memberId', ParseIntPipe) memberId: number,
        @Body(new ValidationPipe()) dto: UpdateClanMemberDto,
        @Request() req,
    ) {
        this.logger.log(`--- TRIGGERED: changeMemberRole method for member ${memberId} in clan ${clanId} ---`);
        const actorId = req.user.userId;
        return this.clansService.changeMemberRole(clanId, actorId, memberId, dto.roleId);
    }


    @Delete(':memberId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Kick a member from a clan' })
    kickMember(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Param('memberId', ParseIntPipe) memberId: number,
        @Request() req,
        @Body() dto: KickMemberDto,
    ) {
        const actorId = req.user.userId;
        return this.clansService.kickMember(clanId, actorId, memberId, dto.reason);
    }


    @Get('warnings')
    @ApiOperation({ summary: 'Get all warnings issued in a clan' })
    getClanWarnings(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Request() req,
    ) {
        const actorId = req.user.userId;
        return this.clansService.getClanWarnings(clanId, actorId);
    }


    @Post(':memberId/warn')
    @ApiOperation({ summary: 'Issue a warning to a clan member' })
    warnMember(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Param('memberId', ParseIntPipe) memberId: number,
        @Body() dto: CreateClanWarningDto,
        @Request() req,
    ) {
        const actorId = req.user.userId;
        return this.clansService.warnMember(clanId, actorId, memberId, dto);
    }


    @Delete('warnings/:warningId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete/revoke a warning from a clan member' })
    deleteClanWarning(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Param('warningId', ParseIntPipe) warningId: number,
        @Request() req,
    ) {
        const actorId = req.user.userId;
        return this.clansService.deleteClanWarning(clanId, actorId, warningId);
    }


    @Post(':memberId/mute')
    @ApiOperation({ summary: 'Mute a clan member' })
    muteMember(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Param('memberId', ParseIntPipe) memberId: number,
        @Body() dto: MuteClanMemberDto,
        @Request() req,
    ) {
        const actorId = req.user.userId;
        return this.clansService.muteMember(clanId, actorId, memberId, dto);
    }


    @Post(':memberId/unmute')
    @ApiOperation({ summary: 'Unmute a clan member' })
    unmuteMember(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Param('memberId', ParseIntPipe) memberId: number,
        @Request() req,
    ) {
        const actorId = req.user.userId;
        return this.clansService.unmuteMember(clanId, actorId, memberId);
    }
}
