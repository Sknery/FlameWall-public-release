import { Injectable, UnauthorizedException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService, PublicUser } from '../users/users.service';
import { Rank } from '../ranks/entities/rank.entity';
import { ClanMember } from 'src/clans/entities/clan-member.entity';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new InternalServerErrorException('JWT_SECRET is not defined in environment variables. Application cannot start.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }


  async validate(payload: any): Promise<{ userId: number; username: string; rank: Rank | null; clanMembership: ClanMember | null; }> {
    this.logger.verbose(`[VALIDATE] 🕵️‍♂️ Validating JWT for user sub: ${payload.sub}`);


    const user = await this.usersService.validateActiveUser(payload.sub);

    this.logger.verbose(`[VALIDATE-SUCCESS] ✅ JWT validation successful for User ID: ${user.id} (${user.username}).`);



    return {
      userId: user.id,
      username: user.username,
      rank: user.rank,
      clanMembership: user.clanMembership
    };
  }
}
