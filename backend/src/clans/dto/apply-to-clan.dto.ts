import { IsObject } from 'class-validator';


export class ApplyToClanDto {

  @IsObject()
  answers: Record<string, any>;
}
