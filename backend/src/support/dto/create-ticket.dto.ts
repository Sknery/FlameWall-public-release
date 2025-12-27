import { IsEnum, IsOptional, IsString, MaxLength, MinLength, IsNumber, IsObject } from 'class-validator';
import { TicketCategory, TicketPriority } from '../entities/support-ticket.entity';

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;

  @IsEnum(TicketCategory)
  category: TicketCategory;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  reportEntityType?: string; // 'POST', 'COMMENT', 'NEWS', 'USER', etc.

  @IsOptional()
  @IsNumber()
  reportEntityId?: number;

  @IsOptional()
  @IsString()
  reportEntityData?: string; // JSON string with entity data
}

