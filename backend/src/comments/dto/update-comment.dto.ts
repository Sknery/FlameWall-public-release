import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';


export class UpdateCommentDto {

  @ApiPropertyOptional({
    example: 'Actually, I changed my mind. Great post!',
    description: 'The updated content of the comment',
    minLength: 1,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content?: string;
}
