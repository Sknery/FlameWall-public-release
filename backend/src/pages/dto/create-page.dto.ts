
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsInt } from 'class-validator';

export class CreatePageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsInt()
  category_id?: number | null;
}