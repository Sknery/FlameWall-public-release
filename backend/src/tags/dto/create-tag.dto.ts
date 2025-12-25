import { IsHexColor, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';


export class CreateTagDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon_url?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}

