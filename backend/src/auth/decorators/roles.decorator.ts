import { SetMetadata } from '@nestjs/common';


export const ROLES_KEY = 'power_level';


export const Roles = (powerLevel: number) => SetMetadata(ROLES_KEY, powerLevel);
