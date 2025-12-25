import { IsEnum, IsInt, IsOptional, IsString, Max, Min, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
export class FindAllUsersDto {
  @IsOptional()
  @IsEnum(['username', 'reputation_count', 'first_login'])
  sortBy?: 'username' | 'reputation_count' | 'first_login' = 'first_login';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)  @IsInt()
  @Min(1)
  @Max(100)  limit?: number = 10;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    }
    return value;
  })
  tagIds?: number[];
}
