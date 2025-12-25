
import { PartialType } from '@nestjs/swagger';
import { CreatePageCategoryDto } from './create-page-category.dto';

export class UpdatePageCategoryDto extends PartialType(CreatePageCategoryDto) {}