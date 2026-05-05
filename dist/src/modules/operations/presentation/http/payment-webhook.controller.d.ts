import { PaymentService } from '../../application/payment.service';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../../infrastructure/persistence/payment.entity';
import { UserServiceEntity } from '../../infrastructure/persistence/user-service.entity';
import { ConfigService } from '@nestjs/config';
export declare class PaymentWebhookController {
    private readonly paymentService;
    private readonly configService;
    private readonly paymentsRepository;
    private readonly userServicesRepository;
    private readonly logger;
    constructor(paymentService: PaymentService, configService: ConfigService, paymentsRepository: Repository<PaymentEntity>, userServicesRepository: Repository<UserServiceEntity>);
    handleWebhook(body: any, signature: string): Promise<{
        status: string;
    }>;
}
