import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNewsDto {
  @ApiProperty({
    example: 'Server Maintenance Announcement',
    description: 'Title of the news article',
    minLength: 3,
    maxLength: 50
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: 'We will be performing server maintenance on Sunday at 10 PM UTC.',
    description: 'Main content of the news article',
    minLength: 10
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  desc: string;
}