import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNewsDto {
  @ApiPropertyOptional({
    example: 'Important Server Update',
    description: 'The updated title of the news article (optional)',
    minLength: 3,
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    example: 'The maintenance has been rescheduled to Monday.',
    description: 'The updated main content of the news article (optional)',
    minLength: 10
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  desc?: string;
}