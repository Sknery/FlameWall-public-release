import { IsArray, IsInt, ArrayMaxSize } from 'class-validator';


export class UpdateUserTagsDto {
  @IsArray()
  @ArrayMaxSize(3)
  @IsInt({ each: true })
  tagIds: number[];
}
