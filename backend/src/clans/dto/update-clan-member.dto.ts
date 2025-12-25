
import { IsInt, IsNotEmpty } from 'class-validator';


export class UpdateClanMemberDto {

  @IsInt()
  @IsNotEmpty()
  roleId: number;
}
