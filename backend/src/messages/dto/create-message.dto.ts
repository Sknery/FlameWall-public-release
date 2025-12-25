import { IsInt, IsNotEmpty, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateMessageDto {

  @ApiProperty({
    description: 'The ID of the user who will receive the message',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  recipientId: number;


  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello there!',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}
