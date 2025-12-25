import { IsInt, IsNotEmpty } from 'class-validator';


export class InviteMemberDto {

  @IsInt()
  @IsNotEmpty()
  userId: number;
}
