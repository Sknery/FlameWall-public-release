import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';
export class PurchaseDto {
  @IsInt()
  itemId: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  targetUsername?: string;
}