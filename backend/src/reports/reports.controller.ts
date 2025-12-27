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
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportStatus, ReportType } from './entities/report.entity';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or already reported' })
  async createReport(@Body() createReportDto: CreateReportDto, @Request() req: any) {
    return this.reportsService.createReport(
      req.user.userId,
      createReportDto.type,
      createReportDto.targetId,
      createReportDto.reason,
      createReportDto.description,
    );
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user reports' })
  async getMyReports(@Request() req: any) {
    return this.reportsService.getUserReports(req.user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(SystemRanks.MODERATOR.power_level)
  @ApiOperation({ summary: 'Get all reports (admin only)' })
  async getReports(
    @Query('status') status?: ReportStatus,
    @Query('type') type?: ReportType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.reportsService.getReports(
      status,
      type,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(SystemRanks.MODERATOR.power_level)
  @ApiOperation({ summary: 'Get report by ID (admin only)' })
  async getReportById(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getReportById(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(SystemRanks.MODERATOR.power_level)
  @ApiOperation({ summary: 'Update report status (admin only)' })
  async updateReportStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateReportStatusDto,
    @Request() req: any,
  ) {
    return this.reportsService.updateReportStatus(
      id,
      updateDto.status,
      req.user.userId,
      updateDto.adminNotes,
    );
  }
}

