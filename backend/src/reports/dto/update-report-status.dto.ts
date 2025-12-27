import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}

