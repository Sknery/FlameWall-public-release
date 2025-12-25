import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';


export class EditClanMessageDto {

  @IsInt()
  @IsNotEmpty()
  clanId: number;


  @IsInt()
  @IsNotEmpty()
  messageId: number;


  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
