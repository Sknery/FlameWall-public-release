import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength, IsHexColor, IsInt, Min, Max, IsObject, ValidateNested, IsBoolean } from 'class-validator';


class ClanPermissionsDto {
    @IsBoolean() canEditDetails: boolean;
    @IsBoolean() canEditAppearance: boolean;
    @IsBoolean() canEditRoles: boolean;
    @IsBoolean() canEditApplicationForm: boolean;
    @IsBoolean() canAcceptMembers: boolean;
    @IsBoolean() canInviteMembers: boolean;
    @IsBoolean() canUseClanTags: boolean;
    @IsBoolean() canAccessAdminChat: boolean;
}


class MemberPermissionsDto {
    @IsInt() @Min(0) maxKickPower: number;
    @IsInt() @Min(0) maxMutePower: number;
    @IsInt() @Min(0) maxPromotePower: number;
    @IsInt() @Min(0) maxDemotePower: number;
    @IsInt() @Min(0) maxWarnPower: number;
}


export class CreateClanRoleDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  name: string;


  @IsHexColor()
  @IsNotEmpty()
  color: string;


  @IsInt()
  @Min(1)
  @Max(999)
  power_level: number;


  @ValidateNested()
  @Type(() => ClanPermissionsDto)
  clanPermissions: ClanPermissionsDto;


  @ValidateNested()
  @Type(() => MemberPermissionsDto)
  memberPermissions: MemberPermissionsDto;
}
