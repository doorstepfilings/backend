import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { UserEntity } from '../infrastructure/persistence/user.entity';
import { OtpVerificationEntity } from '../infrastructure/persistence/otp-verification.entity';
import { NotificationService } from '../../communication/notification.service';

describe('AuthService', () => {
    let service: AuthService;
    let usersRepo: Repository<UserEntity>;
    let otpRepo: Repository<OtpVerificationEntity>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(UserEntity),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(OtpVerificationEntity),
                    useClass: Repository,
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

                            throw new Error(`Unexpected config key: ${key}`);
                        }),
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
        usersRepo = module.get<Repository<UserEntity>>(
            getRepositoryToken(UserEntity),
        );
        otpRepo = module.get<Repository<OtpVerificationEntity>>(
            getRepositoryToken(OtpVerificationEntity),
        );
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
            const user = Object.assign(new UserEntity(), {
                id: 1,
                name: dto.name,
                email: dto.email,
                password: 'hashed-password',
                role: 'user',
                mobileNumber: dto.mobile_number,
                isMobileVerified: false,
                referralCode: null,
                rmUniqueId: null,
                accountantUniqueId: null,
                rmId: null,
                accountantId: null,
                address: null,
                city: null,
                state: null,
                pincode: null,
                regionalManager: null,
                assignedUsers: [],
                accountant: null,
                assignedAccountantUsers: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            jest.spyOn(usersRepo, 'findOne').mockResolvedValue(null);
            jest.spyOn(otpRepo, 'findOne').mockResolvedValue(
                Object.assign(new OtpVerificationEntity(), {
                    id: 1,
                    identifier: dto.email,
                    otp: '123456',
                    verified: true,
                    expiresAt: new Date(Date.now() + 60_000),
                    createdAt: new Date(),
                }),
            );
            jest.spyOn(usersRepo, 'create').mockReturnValue(user);
            jest.spyOn(usersRepo, 'save').mockResolvedValue(user);

            const result = await service.register(dto);
            expect(result.token).toBe('token');
            expect(result.user.email).toBe(dto.email);
        });
    });
});
