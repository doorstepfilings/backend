import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthConfig } from '../../../../config/auth.config';
import { PrismaService } from '../../../../shared/services/prisma.service';

type JwtPayload = {
  email: string;
  role: string;
  sub: number;
  version?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const authConfig = configService.getOrThrow<AuthConfig>('auth');

    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: authConfig.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, tokenVersion: true },
    });

    if (!user || user.tokenVersion !== (payload.version || 1)) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    return {
      email: payload.email,
      id: payload.sub,
      role: payload.role,
      userId: payload.sub,
    };
  }
}
