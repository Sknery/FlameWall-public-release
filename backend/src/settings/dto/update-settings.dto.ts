
import { IsString, IsOptional, MaxLength, IsHexColor } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  site_name?: string;

  @IsOptional()
  @IsHexColor()
  accent_color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  logo_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  favicon_url?: string;
}
