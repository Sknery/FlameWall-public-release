
import { Controller, Get, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ClansService } from './clans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';


@ApiTags('Clans / Messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('clans/:clanId/messages')
export class ClanMessagesController {
    constructor(private readonly clansService: ClansService) { }


    @Get()
    @ApiOperation({ summary: 'Get message history for a clan' })
    getClanMessages(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Request() req,
    ) {
        const userId = req.user.userId;
        return this.clansService.getClanMessages(clanId, userId);
    }
}
