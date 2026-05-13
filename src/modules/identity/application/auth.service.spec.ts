import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { NotificationService } from '../../communication/notification.service';
import { PrismaService } from '../../../shared/services/prisma.service';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findFirst: jest.fn(),
                            create: jest.fn(),
                        },
                        otpVerification: {
                            findFirst: jest.fn(),
                        },
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn().mockResolvedValue('token'),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => {
                            if (key === 'app') {
                                return {
                                    frontendUrl: 'http://127.0.0.1:3000',
                                    nodeEnv: 'test',
                                };
                            }
                            return null;
                        }),
                        get: jest.fn(),
                    },
                },
                {
                    provide: NotificationService,
                    useValue: { 
                        sendEmail: jest.fn().mockResolvedValue(null),
                        sendWelcomeNotification: jest.fn().mockResolvedValue(null),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        it('should create a new user', async () => {
            const dto = {
                name: 'Test User',
                email: 'test@example.com',
                mobile_number: '1234567890',
                password: 'password123',
            };
            const user = {
                id: 1,
                name: dto.name,
                email: dto.email,
                role: 'user',
                mobileNumber: dto.mobile_number,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.otpVerification.findFirst as jest.Mock).mockResolvedValue({
                id: 1,
                identifier: dto.email,
                otp: '123456',
                verified: true,
                expiresAt: new Date(Date.now() + 60_000),
            });
            (prisma.user.create as jest.Mock).mockResolvedValue(user);

            const result = await service.register(dto);
            expect(result.token).toBe('token');
            expect(result.user.email).toBe(dto.email);
        });
    });
});
