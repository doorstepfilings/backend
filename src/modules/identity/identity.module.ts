import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AuthConfig } from '../../config/auth.config';
import { AuthService } from './application/auth.service';
import { ProfileService } from './application/profile.service';
import { JwtAuthGuard } from './infrastructure/auth/jwt-auth.guard';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { UserEntity } from './infrastructure/persistence/user.entity';
import { OtpVerificationEntity } from './infrastructure/persistence/otp-verification.entity';
import { AuthController } from './presentation/http/auth.controller';
import { ProfileController } from './presentation/http/profile.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity, OtpVerificationEntity]),
        PassportModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const auth = configService.getOrThrow<AuthConfig>('auth');

                return {
                    secret: auth.jwtSecret,
                    signOptions: {
                        expiresIn: auth.jwtExpiresIn as never,
                    },
                };
            },
        }),
    ],
    controllers: [AuthController, ProfileController],
    providers: [AuthService, ProfileService, JwtStrategy, JwtAuthGuard],
    exports: [AuthService, ProfileService, JwtAuthGuard, TypeOrmModule],
})
export class IdentityModule {}
