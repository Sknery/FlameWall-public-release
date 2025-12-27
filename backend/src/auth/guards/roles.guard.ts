
import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';


@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}


  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const requiredPowerLevel = this.reflector.getAllAndOverride<number>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPowerLevel) {
      return true;
    }

    const { user } = request;

    if (!user) {
      this.logger.warn(`[ROLES-DENIED] 🚫 No user found in request for ${request.method} ${request.url}`);
      return false;
    }

    const hasPermission = user.rank && user.rank.power_level >= requiredPowerLevel;

    if (!hasPermission) {
      this.logger.warn(`[ROLES-DENIED] 🚫 User ID: ${user?.userId} (Power: ${user?.rank?.power_level}) denied access to a resource requiring Power Level: ${requiredPowerLevel}.`);
      return false;
    }

    return true;
  }
}
