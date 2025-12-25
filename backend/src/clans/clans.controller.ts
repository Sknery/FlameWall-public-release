
import { Controller, Post, Body, UseGuards, Request, ValidationPipe, Get, Query, Param, Patch, HttpCode, ParseIntPipe, HttpStatus, Delete } from '@nestjs/common';
import { ClansService } from './clans.service';
import { CreateClanDto } from './dto/create-clan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FindAllClansDto } from './dto/find-all-clans.dto';
import { HandleApplicationDto } from './dto/handle-application.dto';
import { UpdateClanDto } from './dto/update-clan.dto';
import { UpdateClanSettingsDto } from './dto/update-clan-settings.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';


@ApiTags('Clans')
@Controller('clans')
export class ClansController {
    constructor(private readonly clansService: ClansService) { }


    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new clan' })
    create(
        @Body(new ValidationPipe()) createClanDto: CreateClanDto,
        @Request() req,
    ) {
        const ownerId = req.user.userId;
        return this.clansService.create(createClanDto, ownerId);
    }


    @Get()
    @ApiOperation({ summary: 'Get a paginated list of all clans' })
    findAll(@Query(new ValidationPipe({ transform: true })) query: FindAllClansDto) {
        return this.clansService.findAll(query);
    }


    @Get(':tag')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Get a single clan by its unique tag' })
    findOne(@Param('tag') tag: string, @Request() req) {
        const viewerId = req.user ? req.user.userId : undefined;
        return this.clansService.findOne(tag, viewerId);
    }


    @Post(':clanId/join')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Join an open clan' })
    joinOpenClan(@Param('clanId', ParseIntPipe) clanId: number, @Request() req) {
        return this.clansService.joinOpenClan(clanId, req.user.userId);
    }


    @Post(':clanId/leave')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Leave a clan you are a member of' })
    leaveClan(@Param('clanId', ParseIntPipe) clanId: number, @Request() req) {
        return this.clansService.leaveClan(clanId, req.user.userId);
    }


    @Post(':clanId/apply')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Apply to a clan' })
    applyToClan(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Body(ValidationPipe) dto: any,
        @Request() req,
    ) {
        return this.clansService.applyToClan(clanId, req.user.userId, dto);
    }


    @Patch('applications/:applicationId/handle')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Accept or reject an application' })
    handleApplication(
        @Param('applicationId', ParseIntPipe) applicationId: number,
        @Body(ValidationPipe) dto: HandleApplicationDto,
        @Request() req,
    ) {
        return this.clansService.handleApplication(applicationId, req.user.userId, dto);
    }


    @Get(':tag/management-data')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all data needed to manage a clan' })
    @ApiBearerAuth()
    getManagementData(
        @Param('tag') tag: string,
        @Request() req,
    ) {
        return this.clansService.getManagementData(tag, req.user.userId);
    }


    @Patch(':tag/details')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update clan details' })
    updateClan(
        @Param('tag') tag: string,
        @Body() dto: UpdateClanDto,
        @Request() req,
    ) {
        return this.clansService.updateClanDetails(tag, req.user.userId, dto);
    }


    @Patch(':clanId/settings')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update clan settings like the application form' })
    updateClanSettings(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Body(ValidationPipe) dto: UpdateClanSettingsDto,
        @Request() req,
    ) {
        return this.clansService.updateClanSettings(clanId, req.user.userId, dto);
    }


    @Get('my-warnings')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my active warnings in my current clan' })
    getMyWarnings(@Request() req) {
        return this.clansService.getMyClanWarnings(req.user.userId);
    }


    @Post(':tag/transfer-ownership')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Transfer clan ownership to another member' })
    transferOwnership(
        @Param('tag') tag: string,
        @Request() req,
        @Body(ValidationPipe) dto: TransferOwnershipDto,
    ) {
        return this.clansService.transferOwnership(tag, req.user.userId, dto);
    }


    @Delete(':tag')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a clan (Owner only)' })
    deleteClan(@Param('tag') tag: string, @Request() req) {
        return this.clansService.deleteClan(tag, req.user.userId);
    }
}
