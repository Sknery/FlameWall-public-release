import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional({
    example: 'My Updated Post Title',
    description: 'The updated title of the post (optional)',
    minLength: 5,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({
    example: 'This is the updated detailed content.',
    description: 'The updated main content of the post (optional)',
    minLength: 10
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  content?: string;
}