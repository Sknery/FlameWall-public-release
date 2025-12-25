import { IsInt, IsNotEmpty, IsUUID } from 'class-validator';


export class FromPluginRespondRequestDto {

  @IsUUID()
  @IsNotEmpty()
  responderUuid: string;


  @IsInt()
  @IsNotEmpty()
  requestId: number;
}
