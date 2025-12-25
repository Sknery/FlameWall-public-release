

import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Logger } from '@nestjs/common';
import { RanksService, SystemRanks } from './ranks.service';
import { CreateRankDto } from './dto/create-rank.dto';
import { UpdateRankDto } from './dto/update-rank.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Ranks')
@Controller('ranks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RanksController {
  private readonly logger = new Logger(RanksController.name);

  constructor(private readonly ranksService: RanksService) {}

  @Post()
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiOperation({ summary: 'Create a new rank (Admin only)' })
  create(@Body() createRankDto: CreateRankDto) {
    this.logger.log(`[CREATE] 🎖️ Admin is creating a new rank: ${JSON.stringify(createRankDto)}`);
    return this.ranksService.create(createRankDto);
  }

  @Get()
  @Roles(SystemRanks.MODERATOR.power_level)
  @ApiOperation({ summary: 'Get all ranks (Mods+)' })
  findAll() {
    this.logger.verbose(`[GET-ALL] 🔎 Fetching all ranks.`);
    return this.ranksService.findAll();
  }

  @Patch(':id')
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiOperation({ summary: 'Update a rank (Admin only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRankDto: UpdateRankDto) {
    this.logger.log(`[UPDATE] 📝 Admin is attempting to update Rank ID: ${id} with data: ${JSON.stringify(updateRankDto)}`);
    return this.ranksService.update(id, updateRankDto);
  }

  @Delete(':id')
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiOperation({ summary: 'Delete a rank (Admin only)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Body('migrationRankId') migrationRankId?: number
  ) {
    this.logger.warn(`[DELETE] 🗑️ Admin is attempting to delete Rank ID: ${id}. Migration Target ID: ${migrationRankId || 'N/A'}`);
    return this.ranksService.remove(id, migrationRankId);
  }
}