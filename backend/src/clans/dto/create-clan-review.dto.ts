import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';


export class CreateClanReviewDto {

  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;


  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;
}
