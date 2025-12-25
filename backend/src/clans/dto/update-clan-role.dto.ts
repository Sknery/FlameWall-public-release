
import { PartialType } from '@nestjs/swagger';
import { CreateClanRoleDto } from './create-clan-role.dto';


export class UpdateClanRoleDto extends PartialType(CreateClanRoleDto) {}
