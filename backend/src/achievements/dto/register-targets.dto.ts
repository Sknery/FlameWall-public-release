import { IsString, IsObject, IsNotEmpty } from 'class-validator';


export class RegisterTargetsDto {

  @IsString()
  @IsNotEmpty()
  pluginName: string;


  @IsObject()
  targets: Record<string, string[]>;
}
