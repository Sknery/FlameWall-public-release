
import { IsOptional, IsString, MaxLength } from 'class-validator';


export class KickMemberDto {

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
