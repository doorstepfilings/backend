import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/services/prisma.service';
import { UniqueIDGenerator } from '../../../shared/utils/unique-id.generator';
import { NotificationService } from '../../communication/notification.service';
import { PdfService } from '../../../shared/services/pdf.service';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

export type VerifyPaymentPayload = {
    is_cart?: boolean;
    payment_id: number; // This is the payment table ID in legacy, but here it's used as a ref
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

type PaymentOrderItemResource = {
    application_unique_id: string | null;
    id: number;
    name: string;
    price: number;
    service_id: number;
    status: string;
};

type PaymentOrderResource = {
    amount: number;
    created_at: Date;
    currency: string;
    gst_amount: number;
    id: number;
    invoice_unique_id: string | null;
    items: PaymentOrderItemResource[];
    order_unique_id: string | null;
    payment_provider: string;
    payment_provider_order_id: string | null;
    payment_provider_transaction_id: string | null;
    payment_status: string;
    status: string;
    subtotal: number;
};

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private readonly razorpay: Razorpay;
    private static readonly GST_RATE = 0.18;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly notificationService: NotificationService,
        private readonly pdfService: PdfService,
    ) {
        this.razorpay = new Razorpay({
            key_id: this.configService.getOrThrow<string>('RAZORPAY_KEY_ID'),
            key_secret: this.configService.getOrThrow<string>(
                'RAZORPAY_KEY_SECRET',
            ),
        });
    }

    async createOrder(userServiceId: number) {
        const userService = await this.prisma.userService.findUnique({
            where: { id: userServiceId },
            include: { service: true, user: true },
        });

        if (!userService) {
            throw new BadRequestException('User service not found');
        }

        const totals = this.calculateTotals(userService.amount);

        const options = {
            amount: totals.amountPaise,
            currency: 'INR',
            receipt: `receipt_${userService.id}`,
            notes: {
                user_service_id: userService.id,
                service_name: userService.service?.name,
            },
        };

        try {
            const order = await this.createRazorpayOrder(options);

            // Re-use existing pending or failed payment for this service request if it exists
            let payment = await this.prisma.payment.findFirst({
                where: {
                    userServiceId: userService.id,
                    status: { in: ['pending', 'failed'] }
                }
            });

            if (payment) {
                payment = await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        paymentProviderOrderId: order.id,
                        amount: totals.grandTotal,
                        status: 'pending',
                        paymentStatus: 'pending',
                        createdAt: new Date(),
                    }
                });
            } else {
                payment = await this.prisma.payment.create({
                    data: {
                        userId: userService.userId,
                        userServiceId: userService.id,
                        amount: totals.grandTotal,
                        paymentProviderOrderId: order.id,
                        orderUniqueId: UniqueIDGenerator.generateOrderID(),
                        invoiceUniqueId: UniqueIDGenerator.generateInvoiceID(),
                        notes: { user_service_id: userService.id } as any,
                        status: 'pending',
                        paymentStatus: 'pending',
                    }
                });
            }

            return {
                amount: totals.grandTotal,
                amount_paise: totals.amountPaise,
                base_amount: totals.baseAmount,
                gst_amount: totals.gstAmount,
                grand_total: totals.grandTotal,
                invoice_unique_id: payment.invoiceUniqueId,
                is_cart: false,
                order_unique_id: payment.orderUniqueId,
                razorpay_order_id: order.id,
                currency: 'INR',
                key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
                payment_id: payment.id, // Internal payment record ID
                service_ids: [String(userService.id)],
            };
        } catch (error) {
            throw new BadRequestException(
                'Failed to create Razorpay order: ' + error.message,
            );
        }
    }

    async createCartOrder(userId: number) {
        const items = await this.prisma.userService.findMany({
            where: { userId, status: 'in_cart' },
            include: { service: true },
        });

        if (items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        const subtotal = items.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0,
        );
        const totals = this.calculateTotals(subtotal);

        const options = {
            amount: totals.amountPaise,
            currency: 'INR',
            receipt: `cart_${userId}_${Date.now()}`,
            notes: {
                cart_item_ids: items.map((item) => item.id),
                user_id: userId,
                items_count: items.length,
            },
        };

        try {
            const order = await this.createRazorpayOrder(options);

            // Mark previous pending cart payments as abandoned to avoid clutter
            await this.prisma.payment.updateMany({
                where: { userId, status: 'pending', userServiceId: null },
                data: { status: 'abandoned' }
            });

            // Persist payment record for cart
            const payment = await this.prisma.payment.create({
                data: {
                    userId,
                    amount: totals.grandTotal,
                    paymentProviderOrderId: order.id,
                    orderUniqueId: UniqueIDGenerator.generateOrderID(),
                    invoiceUniqueId: UniqueIDGenerator.generateInvoiceID(),
                    notes: { cart_item_ids: items.map((item) => item.id) } as any,
                    status: 'pending',
                    paymentStatus: 'pending',
                }
            });

            return {
                amount: totals.grandTotal,
                amount_paise: totals.amountPaise,
                base_amount: totals.baseAmount,
                gst_amount: totals.gstAmount,
                grand_total: totals.grandTotal,
                invoice_unique_id: payment.invoiceUniqueId,
                is_cart: true,
                order_unique_id: payment.orderUniqueId,
                razorpay_order_id: order.id,
                currency: 'INR',
                key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
                payment_id: payment.id, // Internal payment record ID
                service_ids: items.map((item) => String(item.id)),
            };
        } catch (error) {
            throw new BadRequestException(
                'Failed to create cart order: ' + error.message,
            );
        }
    }

    async verifyPayment(payload: VerifyPaymentPayload) {
        const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
        const body =
            payload.razorpay_order_id + '|' + payload.razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', secret!)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === payload.razorpay_signature) {
            const payment = await this.prisma.payment.findUnique({
                where: { id: payload.payment_id },
            });

            if (!payment) {
                throw new NotFoundException('Payment record not found');
            }

            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'paid',
                    paymentStatus: 'paid',
                    paymentProviderTransactionId: payload.razorpay_payment_id,
                    paymentProviderStatus: 'captured',
                }
            });

            const cartItemIds = (payment.notes as any)?.cart_item_ids || [];

            if (payload.is_cart && cartItemIds.length > 0) {
                await this.prisma.userService.updateMany({
                    where: { id: { in: cartItemIds } },
                    data: {
                        status: 'paid',
                        paymentStatus: 'success',
                    }
                });
            } else if (payment.userServiceId) {
                await this.prisma.userService.update({
                    where: { id: payment.userServiceId },
                    data: { status: 'paid', paymentStatus: 'success' },
                });
            }

            // Notify user about successful payment
            const paymentWithUser = (await this.prisma.payment.findUnique({
                where: { id: payment.id },
                include: { user: true, userService: { include: { service: true } } },
            })) as any;
            const user = paymentWithUser?.user;

            if (user) {
                const relatedServices = await this.resolveRelatedUserServices(
                    paymentWithUser,
                );
                const serviceName =
                    this.buildPurchasedServicesLabel(relatedServices);
                let invoiceAttachment:
                    | {
                          content: Buffer;
                          contentType: string;
                          filename: string;
                      }
                    | undefined;

                try {
                    const invoicePdf = await this.generateInvoicePdfForPayment(
                        paymentWithUser,
                    );

                    invoiceAttachment = {
                        content: invoicePdf,
                        contentType: 'application/pdf',
                        filename: `invoice_${payment.invoiceUniqueId ?? payment.id}.pdf`,
                    };
                } catch (error) {
                    this.logger.warn(
                        `Failed to generate invoice PDF for payment ${payment.id}: ${
                            (error as Error).message
                        }`,
                    );
                }

                try {
                    await this.notificationService.sendPaymentSuccessNotification(
                        user,
                        {
                            amount: Number(payment.amount || 0),
                            orderUniqueId: payment.orderUniqueId,
                            invoiceUniqueId: payment.invoiceUniqueId,
                        },
                        serviceName,
                        invoiceAttachment
                            ? { attachments: [invoiceAttachment] }
                            : {},
                    );
                } catch (error) {
                    this.logger.error(
                        `Failed to send payment success email for payment ${payment.id}: ${
                            (error as Error).message
                        }`,
                        (error as Error).stack,
                    );
                }
            }


            return {
                invoice_unique_id: payment.invoiceUniqueId,
                order_unique_id: payment.orderUniqueId,
                payment_id: payment.id,
                service_ids: this.resolvePaymentServiceIds(payment).map(String),
                success: true,
            };
        } else {
            throw new BadRequestException('Invalid payment signature');
        }
    }

    async failPayment(paymentId: number, reason?: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (payment && payment.status === 'pending') {
            await this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'failed',
                    paymentStatus: 'failed',
                    notes: {
                        ...((payment.notes as object) || {}),
                        failure_reason: reason || 'User cancelled or gateway failure',
                    } as any,
                }
            });
        }

        return { success: true };
    }

    async processRefund(paymentId: number, reason?: string) {
        const payment = (await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { userService: true },
        })) as any;

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.status !== 'paid') {
            throw new BadRequestException('Only paid payments can be refunded');
        }

        // Logic for triggering Razorpay refund could go here
        // For now, we update internal status as per legacy parity

        await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'refunded',
                refundStatus: 'processed',
                refundReason: reason || 'Customer requested refund',
                refundAmount: payment.amount,
            }
        });

        const cartItemIds = (payment.notes as any)?.cart_item_ids || [];
        if (cartItemIds.length > 0) {
            await this.prisma.userService.updateMany({
                where: { id: { in: cartItemIds } },
                data: { status: 'refunded' }
            });
        } else if (payment.userServiceId) {
            await this.prisma.userService.update({
                where: { id: payment.userServiceId },
                data: { status: 'refunded' }
            });
        }

        // Notify user about refund
        const userService = payment.userServiceId
            ? (await this.prisma.userService.findUnique({
                  where: { id: payment.userServiceId },
                  include: { user: true },
              })) as any
            : null;

        if (userService?.user) {
            await this.notificationService.sendRefundNotification(
                userService.user,
                {
                    refundAmount: Number(payment.amount || 0),
                    orderUniqueId: payment.orderUniqueId,
                    refundReason:
                        reason ||
                        payment.refundReason ||
                        'Customer requested refund',
                },
            );
        }


        return payment;
    }

    private calculateTotals(
        amount: number | string | Prisma.Decimal | null | undefined,
    ) {
        const baseAmount = Number(amount || 0);
        const gstAmount = baseAmount * PaymentService.GST_RATE;
        const grandTotal = Math.round(baseAmount + gstAmount);
        const amountPaise = Math.round(grandTotal * 100);

        return {
            amountPaise,
            baseAmount,
            gstAmount,
            grandTotal,
        };
    }

    private createRazorpayOrder(options: {
        amount: number;
        currency: string;
        notes: Record<string, unknown>;
        receipt: string;
    }) {
        return (
            this.razorpay.orders.create as unknown as (
                request: typeof options,
            ) => Promise<{ id: string }>
        )(options);
    }

    async myOrders(userId: number): Promise<PaymentOrderResource[]> {
        const payments = (await this.prisma.payment.findMany({
            where: { 
                userId,
                status: { not: 'abandoned' }
            },
            include: { userService: { include: { service: true } } },
            orderBy: { createdAt: 'desc' },
        })) as any[];

        const allServiceIds = [
            ...new Set(
                payments.flatMap((payment) =>
                    this.resolvePaymentServiceIds(payment),
                ),
            ),
        ];

        const relatedServices =
            allServiceIds.length > 0
                ? (await this.prisma.userService.findMany({
                      where: { id: { in: allServiceIds } },
                      include: { service: true },
                  })) as any[]
                : [];

        const servicesById = new Map(
            relatedServices.map((service) => [service.id, service]),
        );

        return payments.map((payment) =>
            this.toPaymentOrderResource(payment, servicesById),
        );
    }

    async downloadInvoice(userId: number, paymentId: number): Promise<Buffer> {
        const payment = (await this.prisma.payment.findUnique({
            where: { id: paymentId, userId },
            include: { userService: { include: { service: true } }, user: true },
        })) as any;

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (!this.isPaymentSettled(payment)) {
            throw new BadRequestException(
                'Invoice is available only for paid payments',
            );
        }

        return this.generateInvoicePdfForPayment(payment);
    }

    private async generateInvoicePdfForPayment(payment: any) {
        const context = await this.buildInvoiceContext(payment);
        return this.pdfService.generatePdf('invoice', context);
    }

    private async buildInvoiceContext(payment: any) {
        const orderedServices = await this.resolveRelatedUserServices(payment);
        const relatedServiceIds = this.resolvePaymentServiceIds(payment);

        const services =
            orderedServices.length > 0
                ? orderedServices.map((service, index) => {
                      const totals = this.calculateTotals(service.amount);

                      return {
                          index: index + 1,
                          name: service.service?.name || 'Service',
                          plan: (service.formData as any)?.pricing_plan || '',
                          basePrice: totals.baseAmount,
                          gstAmount: totals.gstAmount,
                          totalAmount: totals.grandTotal,
                      };
                  })
                : [
                      {
                          index: 1,
                          name: 'Service Purchase',
                          plan: '',
                          ...this.calculateTotals(payment.amount),
                      },
                  ].map((item) => ({
                      index: item.index,
                      name: item.name,
                      plan: item.plan,
                      basePrice: item.baseAmount,
                      gstAmount: item.gstAmount,
                      totalAmount: item.grandTotal,
                  }));

        const baseAmount = services.reduce((acc, s) => acc + s.basePrice, 0);
        const gstAmount = services.reduce((acc, s) => acc + s.gstAmount, 0);
        const grandTotal = services.reduce((acc, s) => acc + s.totalAmount, 0);

        const context = {
            company: {
                name: 'DoorstepFilings',
                addressLine1: 'A/639, Sun WestBank',
                addressLine2: 'Nr. Shiv Cinema, Ashram Road, Navrangpura, Ahmedabad - 380009',
                email: 'support@doorstepfilings.com',
                phone: '+91 98981 96396',
                gstin: '24AAGCF9541C1ZT',
            },
            isPaid: this.isPaymentSettled(payment),
            invoiceId: payment.invoiceUniqueId,
            orderId: payment.orderUniqueId,
            date: (payment.createdAt ? new Date(payment.createdAt) : new Date()).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
            user: {
                name: payment.user?.name || 'Customer',
                email: payment.user?.email || '',
                phone: payment.user?.mobileNumber || '',
                address: payment.user?.address || '',
            },
            payment: {
                provider: payment.paymentProvider || 'N/A',
                providerOrderId: payment.paymentProviderOrderId || 'N/A',
                transactionId: payment.paymentProviderTransactionId || 'N/A',
                status: payment.status ? payment.status.toUpperCase() : 'UNKNOWN',
            },
            services,
            totals: {
                baseAmount,
                gstAmount,
                grandTotal,
            }
        };
        return context;
    }

    private resolvePaymentServiceIds(payment: any) {
        const cartItemIds = Array.isArray((payment.notes as any)?.cart_item_ids)
            ? (payment.notes as any).cart_item_ids
            : [];
        const serviceIds = [...cartItemIds, payment.userServiceId].filter(
            (value): value is number => Number.isInteger(Number(value)),
        );

        return [...new Set(serviceIds.map((value) => Number(value)))];
    }

    private isPaymentSettled(payment: any) {
        const normalizedStatus = String(payment.status || '').toLowerCase();
        const normalizedPaymentStatus = String(
            payment.paymentStatus || '',
        ).toLowerCase();

        return (
            normalizedStatus === 'paid' ||
            normalizedPaymentStatus === 'paid' ||
            normalizedPaymentStatus === 'success'
        );
    }

    private async resolveRelatedUserServices(payment: any) {
        const relatedServiceIds = this.resolvePaymentServiceIds(payment);
        const relatedServices =
            relatedServiceIds.length > 0
                ? (await this.prisma.userService.findMany({
                      where: { id: { in: relatedServiceIds } },
                      include: { service: true },
                  })) as any[]
                : [];
        const relatedServicesById = new Map(
            relatedServices.map((service) => [service.id, service]),
        );

        return relatedServiceIds
            .map((serviceId) => {
                if (
                    payment.userService &&
                    payment.userService.id === serviceId &&
                    payment.userService.service
                ) {
                    return payment.userService;
                }

                return relatedServicesById.get(serviceId) ?? null;
            })
            .filter(
                (service): service is any => service !== null,
            );
    }

    private buildPurchasedServicesLabel(services: any[]) {
        const serviceNames = services
            .map((service) => service.service?.name?.trim())
            .filter((name): name is string => Boolean(name));

        if (serviceNames.length === 0) {
            return 'Service Purchase';
        }

        if (serviceNames.length === 1) {
            return serviceNames[0];
        }

        if (serviceNames.length === 2) {
            return `${serviceNames[0]} and ${serviceNames[1]}`;
        }

        return `${serviceNames[0]} and ${serviceNames.length - 1} more services`;
    }

    private toPaymentOrderResource(
        payment: any,
        servicesById: Map<number, any>,
    ): PaymentOrderResource {
        const services = this.resolvePaymentServiceIds(payment)
            .map((serviceId) => {
                if (
                    payment.userService &&
                    payment.userService.id === serviceId &&
                    payment.userService.service
                ) {
                    return payment.userService;
                }

                return servicesById.get(serviceId) ?? null;
            })
            .filter(
                (service): service is any => service !== null,
            );

        const subtotalFromServices = services.reduce(
            (sum, service) => sum + Number(service.amount || 0),
            0,
        );
        const amount = Number(payment.amount || 0);
        const subtotal = Number(
            (subtotalFromServices > 0
                ? subtotalFromServices
                : amount / (1 + PaymentService.GST_RATE)
            ).toFixed(2),
        );
        const gstAmount = Number((amount - subtotal).toFixed(2));

        return {
            amount,
            created_at: payment.createdAt,
            currency: payment.currency,
            gst_amount: gstAmount,
            id: payment.id,
            invoice_unique_id: payment.invoiceUniqueId,
            items: services.map((service) => ({
                application_unique_id: service.applicationUniqueId,
                id: service.id,
                name: service.service?.name || 'Service',
                price: Number(service.amount || service.service?.price || 0),
                service_id: service.serviceId,
                status: service.status,
            })),
            order_unique_id: payment.orderUniqueId,
            payment_provider: payment.paymentProvider,
            payment_provider_order_id: payment.paymentProviderOrderId,
            payment_provider_transaction_id:
                payment.paymentProviderTransactionId,
            payment_status: payment.paymentStatus,
            status: payment.status,
            subtotal,
        };
    }
}
