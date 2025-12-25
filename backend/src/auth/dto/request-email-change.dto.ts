import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RequestEmailChangeDto {
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  currentPassword: string;
}
