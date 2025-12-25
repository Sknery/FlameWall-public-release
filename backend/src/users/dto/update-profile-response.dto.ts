import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UpdateProfileResponseDto {
  @ApiProperty({ description: 'A new JWT token with updated user data' })
  access_token: string;

  @ApiProperty({ type: User })
  user: User;
}