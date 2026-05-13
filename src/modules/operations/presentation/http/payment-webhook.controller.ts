import {
    Controller,
    Post,
    Body,
    Headers,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/services/prisma.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Controller('payments/razorpay')
export class PaymentWebhookController {
    private readonly logger = new Logger(PaymentWebhookController.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
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
                const payment = await this.prisma.payment.findFirst({
                    where: { paymentProviderOrderId: razorpayOrderId },
                });

                if (payment && payment.status !== 'paid') {
                    await this.prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'paid',
                            paymentStatus: 'paid',
                            paymentProviderTransactionId: razorpayPaymentId,
                            paymentProviderStatus: 'captured',
                        }
                    });

                    // Update associated user services
                    const cartItemIds = (payment.notes as any)?.cart_item_ids;
                    if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
                        await this.prisma.userService.updateMany({
                            where: { id: { in: cartItemIds } },
                            data: { status: 'paid', paymentStatus: 'success' },
                        });
                    } else if (payment.userServiceId) {
                        await this.prisma.userService.update({
                            where: { id: payment.userServiceId },
                            data: { status: 'paid', paymentStatus: 'success' },
                        });
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
                const payment = await this.prisma.payment.findFirst({
                    where: { paymentProviderOrderId: razorpayOrderId },
                });

                if (payment) {
                    await this.prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            refundStatus: 'processed',
                            refundId: refundEntity?.id,
                        }
                    });
                    this.logger.log(`Refund processed via webhook: ${refundEntity?.id}`);
                }
            }
        }

        return { status: 'ok' };
    }
}
