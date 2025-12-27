import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportType, ReportReason } from '../entities/report.entity';

export class CreateReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsNumber()
  targetId: number;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

