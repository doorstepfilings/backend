import {
    Controller,
    Post,
    Body,
    Headers,
    BadRequestException,
    Logger,
    RawBodyRequest,
    Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from '../../application/payment.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../../infrastructure/persistence/payment.entity';
import { UserServiceEntity } from '../../infrastructure/persistence/user-service.entity';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Controller('payments/razorpay')
export class PaymentWebhookController {
    private readonly logger = new Logger(PaymentWebhookController.name);

    constructor(
        private readonly paymentService: PaymentService,
        private readonly configService: ConfigService,
        @InjectRepository(PaymentEntity)
        private readonly paymentsRepository: Repository<PaymentEntity>,
        @InjectRepository(UserServiceEntity)
        private readonly userServicesRepository: Repository<UserServiceEntity>,
    ) {}

    @Post('webhook')
    async handleWebhook(
        @Body() body: any,
        @Headers('x-razorpay-signature') signature: string,
    ) {
        const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');

        if (secret) {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(body))
                .digest('hex');

            if (signature !== expectedSignature) {
                throw new BadRequestException('Invalid webhook signature');
            }
        }

        const event = body?.event as string | undefined;
        this.logger.log(`Razorpay webhook received: ${event}`);

        if (event === 'payment.captured') {
            const paymentEntity = body?.payload?.payment?.entity;
            const razorpayOrderId: string = paymentEntity?.order_id;
            const razorpayPaymentId: string = paymentEntity?.id;

            if (razorpayOrderId) {
                // Find the matching payment record by provider order ID
                const payment = await this.paymentsRepository.findOne({
                    where: { paymentProviderOrderId: razorpayOrderId },
                });

                if (payment && payment.status !== 'paid') {
                    payment.status = 'paid';
                    payment.paymentStatus = 'paid';
                    payment.paymentProviderTransactionId = razorpayPaymentId;
                    payment.paymentProviderStatus = 'captured';
                    await this.paymentsRepository.save(payment);

                    // Update associated user services
                    const cartItemIds = (payment.notes as any)?.cart_item_ids;
                    if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
                        await this.userServicesRepository.update(
                            cartItemIds,
                            { status: 'paid', paymentStatus: 'success' },
                        );
                    } else if (payment.userServiceId) {
                        await this.userServicesRepository.update(
                            payment.userServiceId,
                            { status: 'paid', paymentStatus: 'success' },
                        );
                    }

                    this.logger.log(
                        `Payment captured via webhook: ${razorpayPaymentId} → order ${razorpayOrderId}`,
                    );
                }
            }
        }

        if (event === 'refund.processed') {
            const refundEntity = body?.payload?.refund?.entity;
            const razorpayOrderId: string = refundEntity?.payment_id;

            if (razorpayOrderId) {
                const payment = await this.paymentsRepository.findOne({
                    where: { paymentProviderOrderId: razorpayOrderId },
                });

                if (payment) {
                    payment.refundStatus = 'processed';
                    payment.refundId = refundEntity?.id;
                    await this.paymentsRepository.save(payment);
                    this.logger.log(`Refund processed via webhook: ${refundEntity?.id}`);
                }
            }
        }

        return { status: 'ok' };
    }
}
