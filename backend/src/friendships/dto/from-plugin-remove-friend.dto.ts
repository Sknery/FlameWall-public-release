import { IsString, IsUUID } from 'class-validator';


export class FromPluginRemoveFriendDto {

  @IsUUID()
  removerUuid: string;


  @IsString()
  friendToRemoveName: string;
}
