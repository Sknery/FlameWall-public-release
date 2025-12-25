import { IsInt, IsOptional, IsBoolean } from 'class-validator';


export class AdminUpdateUserDto {

  @IsOptional()
  @IsInt({ message: 'Rank ID must be an integer.' })
  rank_id?: number;


  @IsOptional()
  @IsInt()
  reputation_count?: number;


  @IsOptional()
  @IsBoolean()
  is_verified_youtuber?: boolean;
}
