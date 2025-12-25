import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateFriendRequestDto {

  @ApiProperty({
    example: 5,
    description: 'The ID of the user to whom the friend request is being sent',
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  receiverId: number;
}
