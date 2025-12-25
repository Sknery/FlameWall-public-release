import { IsString, IsNotEmpty, MaxLength, IsIn } from 'class-validator';


export class ApplicationFieldDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string;


  @IsIn(['text', 'textarea'])
  type: 'text' | 'textarea';
}
