import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRanks } from '../ranks/ranks.service';
import { BanReasonsService } from './ban-reasons.service';
import { CreateBanReasonDto } from './dto/create-ban-reason.dto';


@ApiTags('Admin / Ban Reasons')
@Controller('admin/ban-reasons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRanks.ADMIN.power_level)
@ApiBearerAuth()
export class BanReasonsController {
  constructor(private readonly banReasonsService: BanReasonsService) {}


  @Post()
  create(@Body() createDto: CreateBanReasonDto) {
    return this.banReasonsService.create(createDto);
  }


  @Get()
  findAll() {
    return this.banReasonsService.findAll();
  }


  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.banReasonsService.remove(id);
  }
}
