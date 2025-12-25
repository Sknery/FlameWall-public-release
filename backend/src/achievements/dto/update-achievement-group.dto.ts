

import { PartialType } from '@nestjs/swagger';
import { CreateAchievementGroupDto } from './create-achievement-group.dto';


export class UpdateAchievementGroupDto extends PartialType(
  CreateAchievementGroupDto,
) {}