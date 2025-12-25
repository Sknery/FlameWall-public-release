
import { IsString, IsNotEmpty, MaxLength, Matches, IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRankDto {
  @ApiProperty({ example: 'Super VIP', description: 'The display name of the rank' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'supervip', description: 'The system name for in-game matching (no spaces, lowercase)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, { message: 'System name can only contain lowercase letters, numbers, hyphens, and underscores.' })
  system_name: string;

  @ApiProperty({ example: 999, description: 'Power level (1-999)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  power_level: number;

  @ApiProperty({ example: '#FFD700', description: 'Hex color code for display' })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Color must be a valid hex code (e.g., #RRGGBB)' })
  display_color: string;

  @ApiPropertyOptional({ example: 'lp user {username} parent set owner', description: 'Command template for issuing the rank.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  command_template?: string;

  @ApiPropertyOptional({ example: 'lp user {username} parent remove owner', description: 'Command template for removing the rank.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  command_template_remove?: string;

  @ApiPropertyOptional({ description: 'If true, this rank will not be overwritten by game sync.' })
  @IsOptional()
  @IsBoolean()
  is_site_only?: boolean;
}

