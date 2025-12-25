import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AchievementGroupsService } from './achievement-groups.service';
import { CreateAchievementGroupDto } from './dto/create-achievement-group.dto';
import { UpdateAchievementGroupDto } from './dto/update-achievement-group.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRanks } from 'src/ranks/ranks.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';


@ApiTags('Admin / Achievements')
@Controller('admin/achievement-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRanks.ADMIN.power_level)
@ApiBearerAuth()
export class AchievementGroupsController {
  constructor(private readonly groupsService: AchievementGroupsService) { }


  @Post()
  create(@Body() createDto: CreateAchievementGroupDto) {
    return this.groupsService.create(createDto);
  }


  @Get()
  findAll() {
    return this.groupsService.findAll();
  }


  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateAchievementGroupDto) {
    return this.groupsService.update(id, updateDto);
  }


  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }


  @Get('/server-groups')
  findAllServerGroups() {
    return this.groupsService.findAllServerGroups();
  }
}
