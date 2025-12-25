
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";


export class MuteClanMemberDto {

    @IsString()
    @MaxLength(255)
    reason: string;


    @IsOptional()
    @IsInt()
    @Min(1)
    duration_minutes?: number;
}
