import { IsString, IsUUID } from 'class-validator';


export class FromPluginAddFriendDto {

  @IsUUID()
  requesterUuid: string;


  @IsString()
  receiverName: string;
}
