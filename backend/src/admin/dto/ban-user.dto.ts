import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';


export class BanUserDto {

  @IsString()
  @IsNotEmpty()
  reason: string;


  @IsOptional()
  @IsInt()
  @Min(1)
  duration_hours?: number;
}
