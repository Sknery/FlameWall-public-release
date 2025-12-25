import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';


export class EditMessageDto {

  @IsNotEmpty()
  @IsInt()
  messageId: number;


  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  content: string;
}
