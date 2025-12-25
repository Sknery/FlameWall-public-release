
import { IsInt, IsNotEmpty } from 'class-validator';


export class TransferOwnershipDto {

  @IsInt()
  @IsNotEmpty()
  newOwnerId: number;


  @IsInt()
  @IsNotEmpty()
  oldOwnerNewRoleId: number;
}
