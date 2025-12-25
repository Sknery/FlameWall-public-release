import { IsInt, IsNotEmpty } from 'class-validator';


export class DeleteMessageDto {

  @IsNotEmpty()
  @IsInt()
  messageId: number;
}
