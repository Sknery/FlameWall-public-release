import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';


@Injectable()
export class PluginApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(PluginApiKeyGuard.name);

  constructor(private readonly configService: ConfigService) {}


  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-api-key'];
    const validKey = this.configService.get<string>('PLUGIN_SECRET_KEY');

    if (!providedKey || providedKey !== validKey) {
      this.logger.warn(`[DENIED] 🚫 Plugin access denied from IP: ${request.ip}. Reason: Invalid or missing API key.`);
      throw new UnauthorizedException('Invalid or missing API key for plugin');
    }

    this.logger.verbose(`[GRANTED] 🔌 Plugin access granted to IP: ${request.ip}.`);
    return true;
  }
}
