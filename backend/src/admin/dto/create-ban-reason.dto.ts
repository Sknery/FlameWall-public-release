import { IsString, IsNotEmpty, MaxLength } from 'class-validator';


export class CreateBanReasonDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}
