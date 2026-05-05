import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthConfig } from '../../../../config/auth.config';

type JwtPayload = {
    email: string;
    role: string;
    sub: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const authConfig = configService.getOrThrow<AuthConfig>('auth');

        super({
            ignoreExpiration: false,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: authConfig.jwtSecret,
        });
    }

    validate(payload: JwtPayload) {
        return {
            email: payload.email,
            role: payload.role,
            userId: payload.sub,
        };
    }
}
