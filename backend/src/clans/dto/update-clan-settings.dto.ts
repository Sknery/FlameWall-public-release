
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationFieldDto } from './application-field.dto';


export class UpdateClanSettingsDto {

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationFieldDto)
  application_template: ApplicationFieldDto[];
}

