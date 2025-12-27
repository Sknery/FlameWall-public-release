import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Report, ReportType, ReportStatus, ReportReason } from './entities/report.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Clan } from '../clans/entities/clan.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Clan)
    private clansRepository: Repository<Clan>,
    private dataSource: DataSource,
  ) {}

  async createReport(
    reporterId: number,
    type: ReportType,
    targetId: number,
    reason: ReportReason,
    description?: string,
  ): Promise<Report> {
    // Validate target exists
    await this.validateTarget(type, targetId);

    // Check if user already reported this target
    const existingReport = await this.reportsRepository.findOne({
      where: {
        reporterId,
        type,
        targetId,
        status: ReportStatus.PENDING,
      },
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this item. Please wait for moderation.');
    }

    const report = this.reportsRepository.create({
      reporterId,
      type,
      targetId,
      reason,
      description: description || null,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportsRepository.save(report);
    this.logger.log(`[REPORT-CREATE] User ${reporterId} reported ${type} ${targetId} for ${reason}`);
    
    return savedReport;
  }

  async getReports(
    status?: ReportStatus,
    type?: ReportType,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ reports: Report[]; total: number }> {
    const queryBuilder = this.reportsRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.reviewer', 'reviewer')
      .orderBy('report.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('report.type = :type', { type });
    }

    const [reports, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { reports, total };
  }

  async getReportById(id: number): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ['reporter', 'reviewer', 'post', 'comment', 'reportedUser', 'clan'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async updateReportStatus(
    reportId: number,
    status: ReportStatus,
    reviewerId: number,
    adminNotes?: string,
  ): Promise<Report> {
    const report = await this.getReportById(reportId);

    report.status = status;
    report.reviewerId = reviewerId;
    report.adminNotes = adminNotes || null;

    if (status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED) {
      report.resolvedAt = new Date();
    }

    const updatedReport = await this.reportsRepository.save(report);
    this.logger.log(`[REPORT-UPDATE] Report ${reportId} status changed to ${status} by reviewer ${reviewerId}`);

    return updatedReport;
  }

  async getUserReports(userId: number): Promise<Report[]> {
    return this.reportsRepository.find({
      where: { reporterId: userId },
      order: { createdAt: 'DESC' },
      relations: ['post', 'comment', 'reportedUser', 'clan'],
    });
  }

  private async validateTarget(type: ReportType, targetId: number): Promise<void> {
    switch (type) {
      case ReportType.POST:
        const post = await this.postsRepository.findOne({ where: { id: targetId } });
        if (!post) throw new NotFoundException(`Post with ID ${targetId} not found`);
        break;
      case ReportType.COMMENT:
        const comment = await this.commentsRepository.findOne({ where: { id: targetId } });
        if (!comment) throw new NotFoundException(`Comment with ID ${targetId} not found`);
        break;
      case ReportType.USER:
        const user = await this.usersRepository.findOne({ where: { id: targetId } });
        if (!user) throw new NotFoundException(`User with ID ${targetId} not found`);
        break;
      case ReportType.CLAN:
        const clan = await this.clansRepository.findOne({ where: { id: targetId } });
        if (!clan) throw new NotFoundException(`Clan with ID ${targetId} not found`);
        break;
      case ReportType.MESSAGE:
        // Messages are handled separately, validation can be added if needed
        break;
      default:
        throw new BadRequestException(`Invalid report type: ${type}`);
    }
  }
}

