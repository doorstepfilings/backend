import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';

// Mock Twilio to intercept create calls
const mockTwilioMessageCreate = jest.fn();
jest.mock('twilio', () => {
    return {
        Twilio: jest.fn().mockImplementation(() => ({
            messages: {
                create: mockTwilioMessageCreate,
            },
        })),
    };
});

describe('NotificationService', () => {
    let service: NotificationService;
    let mailerService: MailerService;
    let configService: ConfigService;

    const mockMailerService = {
        sendMail: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
        getOrThrow: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                { provide: MailerService, useValue: mockMailerService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        // Setup base config mocks before getting service instances
        mockConfigService.get.mockImplementation((key) => {
            if (key === 'app.twilio') {
                return {
                    sid: 'AC_TEST_SID',
                    token: 'TEST_TOKEN',
                    number: '+1234567890',
                };
            }
            if (key === 'app.frontendUrl') {
                return 'http://localhost:3000';
            }
            return null;
        });
        
        mockConfigService.getOrThrow.mockImplementation((key) => {
            if (key === 'app.twilio') {
                return {
                    sid: 'AC_TEST_SID',
                    token: 'TEST_TOKEN',
                    number: '+1234567890',
                };
            }
            throw new Error(`Config ${key} not found`);
        });

        service = module.get<NotificationService>(NotificationService);
        mailerService = module.get<MailerService>(MailerService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendEmail', () => {
        it('should call mailerService.sendMail with correct parameters', async () => {
            mockMailerService.sendMail.mockResolvedValueOnce(true);

            await service.sendEmail('test@example.com', 'Subject', 'template', { key: 'value' });

            expect(mockMailerService.sendMail).toHaveBeenCalledWith({
                to: 'test@example.com',
                subject: 'Subject',
                template: 'template',
                context: { 
                    key: 'value',
                    subject: 'Subject',
                    dashboardUrl: 'http://localhost:3000/dashboard',
                    year: new Date().getFullYear(),
                },
            });
        });
    });

    describe('sendSms', () => {
        it('should format phone number and call twilio client', async () => {
            mockTwilioMessageCreate.mockResolvedValueOnce({ sid: 'SM_TEST' });

            await service.sendSms('9876543210', 'Test SMS');

            expect(mockTwilioMessageCreate).toHaveBeenCalledWith({
                body: 'Test SMS',
                from: '+1234567890',
                to: '+9876543210',
            });
        });

        it('should handle already formatted phone numbers properly', async () => {
            mockTwilioMessageCreate.mockResolvedValueOnce({ sid: 'SM_TEST' });

            await service.sendSms('+919876543210', 'Test SMS with Plus');

            expect(mockTwilioMessageCreate).toHaveBeenCalledWith({
                body: 'Test SMS with Plus',
                from: '+1234567890',
                to: '+919876543210',
            });
        });
    });
});
