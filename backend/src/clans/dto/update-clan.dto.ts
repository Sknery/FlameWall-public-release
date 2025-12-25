import { IsString, IsOptional, MaxLength, IsEnum, IsHexColor } from 'class-validator';
import { ClanJoinType } from '../entities/clan.entity';


export class UpdateClanDto {

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;


  @IsEnum(ClanJoinType)
  @IsOptional()
  join_type?: ClanJoinType;


  @IsString()
  @IsOptional()
  card_image_url?: string;


  @IsString()
  @IsOptional()
  card_icon_url?: string;


  @IsHexColor()
  @IsOptional()
  card_color?: string;


  @IsHexColor()
  @IsOptional()
  text_color?: string;
}
