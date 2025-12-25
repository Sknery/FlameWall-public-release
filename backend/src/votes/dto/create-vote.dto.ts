import { IsIn, IsInt, IsNotEmpty } from 'class-validator';

export class CreateVoteDto {
  @IsNotEmpty()
  @IsInt()
  @IsIn([-1, 1], { message: 'Vote value must be 1 or -1' })
  value: number;
}