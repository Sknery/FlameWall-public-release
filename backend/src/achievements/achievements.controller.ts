import { Controller, Get, Post, Body, UseGuards, Patch, Param, ParseIntPipe, Delete, Request, HttpStatus, HttpCode } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRanks } from '../ranks/ranks.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PluginApiKeyGuard } from 'src/auth/guards/plugin-api-key.guard';
import { RegisterTargetsDto } from './dto/register-targets.dto';


@ApiTags('Achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) { }


  @Get('progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all achievements with current user progress' })
  getAchievementsWithProgress(@Request() req) {
    const userId = req.user.userId;
    return this.achievementsService.findAllForUser(userId);
  }




  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new achievement' })
  create(@Body() createAchievementDto: CreateAchievementDto) {
    return this.achievementsService.create(createAchievementDto);
  }


  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all achievements (for admin panel)' })
  findAll() {
    return this.achievementsService.findAll();
  }


  @Get('admin/config-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get data for the achievement UI builder' })
  getConfigData() {
    return this.achievementsService.getAchievementConfigData();
  }


  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single achievement by ID (for admin panel)' })
  findOneForAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.achievementsService.findOne(id);
  }


  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an achievement' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateAchievementDto: UpdateAchievementDto) {
    return this.achievementsService.update(id, updateAchievementDto);
  }


  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an achievement' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.achievementsService.remove(id);
  }


  @Post('admin/request-sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request a target sync from the game plugin' })
  requestSync() {
    this.achievementsService.requestSyncFromPlugin();
    return { message: 'Sync request sent to the plugin.' };
  }


  @Post('admin/register-targets')
  @UseGuards(PluginApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register achievable targets from a game plugin' })
  registerTargets(@Body() registrationDto: RegisterTargetsDto) {
    this.achievementsService.registerDynamicTargets(registrationDto);
    return { message: 'Targets registered successfully.' };
  }


  @Get('periodic-checks')
  @UseGuards(PluginApiKeyGuard)
  @ApiOperation({ summary: 'Get all achievements that use PERIODIC_CHECK trigger for a game plugin' })
  findPeriodicChecks() {
    return this.achievementsService.findPeriodicChecks();
  }
}
