
import { IsString, IsInt, IsBoolean, IsOptional, IsUrl, Min, MaxLength, IsNotEmpty, IsEnum, IsObject } from 'class-validator';
import { ShopItemType } from '../entities/shop-item.entity';

export class CreateShopDto {
  @IsString({ message: 'Name must be a string.' })
  @IsNotEmpty({ message: 'Name should not be empty.' })
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description: string;

  @IsInt({ message: 'Price must be an integer.' })
  @Min(0, { message: 'Price cannot be negative.' })
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;

  @IsEnum(ShopItemType)
  item_type: ShopItemType;

  @IsOptional()
  @IsObject()
  cosmetic_data?: Record<string, any>;

  @IsOptional()  @IsString()
  @MaxLength(255)
  ingame_command: string;

  @IsBoolean()
  is_active: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;
}

export class UpdateShopDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsInt() @Min(0) price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;

  @IsOptional()
  @IsEnum(ShopItemType)
  item_type?: ShopItemType;

  @IsOptional()
  @IsObject()
  cosmetic_data?: Record<string, any>;

  @IsOptional() @IsString() @MaxLength(255) ingame_command?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
  @IsOptional() @IsString() @MaxLength(50) category?: string;
}
