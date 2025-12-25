

import { IsString, IsNotEmpty, MaxLength, Matches, IsEnum, IsHexColor, IsOptional, IsUrl } from 'class-validator';
import { ClanJoinType } from '../entities/clan.entity';


export class CreateClanDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  name: string;


  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Tag can only contain letters, numbers, and underscores.',
  })
  tag: string;


  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;


  @IsEnum(ClanJoinType)
  join_type: ClanJoinType;


  @IsOptional()
  @IsString()
  @MaxLength(255)
  card_icon_url?: string;


  @IsOptional()
  @IsString()
  @MaxLength(255)
  card_image_url?: string;
}

