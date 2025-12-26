

import { IsString, IsNotEmpty, IsObject, IsOptional, IsBoolean, IsHexColor, IsInt } from 'class-validator';

export class CreateAchievementDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  icon_url?: string;

  @IsOptional()
  @IsHexColor()
  card_color?: string;

  @IsOptional()
  @IsHexColor()
  text_color?: string;

  @IsOptional()
  @IsInt()
  group_id?: number | null;

  @IsOptional()
  @IsInt()
  parent_id?: number | null;

  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;

  @IsOptional()
  @IsString()
  reward_command?: string;

  @IsOptional()
  @IsInt()
  reward_coins?: number;

  @IsNotEmpty()
  @IsObject()
  conditions: Record<string, any>;
}