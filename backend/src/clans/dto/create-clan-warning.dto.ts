import { IsString, IsNotEmpty, MaxLength } from 'class-validator';


export class CreateClanWarningDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    reason: string;
}
