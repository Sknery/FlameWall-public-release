import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    example: 'My First Amazing Post!',
    description: 'The title of the post',
    minLength: 5,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: 'This is the detailed content of my first amazing post. It can be quite long and support markdown in the future!',
    description: 'The main content of the post',
    minLength: 10
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  content: string;
}