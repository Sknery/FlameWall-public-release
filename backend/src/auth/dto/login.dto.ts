import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class LoginDto {

  @ApiProperty({ example: 'user@example.com', description: 'User email address for login' })
  @IsNotEmpty()
  @IsEmail()
  email: string;


  @ApiProperty({ example: 'SecurePassword123!', description: 'User password for login' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
