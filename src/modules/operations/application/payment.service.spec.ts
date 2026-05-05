import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { PaymentService } from './payment.service';
import { UserServiceEntity } from '../infrastructure/persistence/user-service.entity';
import { PaymentEntity } from '../infrastructure/persistence/payment.entity';
import { PdfService } from '../../../shared/services/pdf.service';
import { NotificationService } from '../../communication/notification.service';

const createOrderMock = jest.fn();

jest.mock('razorpay', () =>
    jest.fn().mockImplementation(() => ({
        orders: {
            create: createOrderMock,
        },
    })),
);

describe('PaymentService', () => {
    let configService: ConfigService;
    let userServicesRepo: {
        find: jest.Mock;
        findOne: jest.Mock;
        findOneOrFail: jest.Mock;
        save: jest.Mock;
        update: jest.Mock;
    };
    let paymentsRepo: {
        create: jest.Mock;
        find: jest.Mock;
        findOne: jest.Mock;
        save: jest.Mock;
    };
    let notificationService: Partial<NotificationService>;
    let pdfService: any;
    let service: PaymentService;

    beforeEach(() => {
        createOrderMock.mockReset();
        userServicesRepo = {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
        };
        paymentsRepo = {
            create: jest.fn((data) => data),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
        };
        notificationService = {
            sendPaymentSuccessNotification: jest.fn(),
            sendRefundNotification: jest.fn(),
        };
        configService = {
            get: jest.fn((key: string) => {
                if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_key';
                if (key === 'RAZORPAY_KEY_SECRET') return 'secret';
                return undefined;
            }),
            getOrThrow: jest.fn((key: string) => {
                if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_key';
                if (key === 'RAZORPAY_KEY_SECRET') return 'secret';
                throw new Error(`Unknown key ${key}`);
            }),
        } as unknown as ConfigService;

        pdfService = {
            generatePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
        };

        service = new PaymentService(
            userServicesRepo as unknown as Repository<UserServiceEntity>,
            paymentsRepo as unknown as Repository<PaymentEntity>,
            configService,
            notificationService as NotificationService,
            pdfService as PdfService,
        );
    });

    it('creates a single-service order with explicit totals', async () => {
        userServicesRepo.findOne.mockResolvedValue({
            amount: '1000.00',
            id: 42,
            userId: 1,
            service: { name: 'GST Registration' },
            user: { id: 1, email: 'test@example.com' },
        });
        createOrderMock.mockResolvedValue({ id: 'order_single_123' });

        const result = await service.createOrder(42);

        expect(createOrderMock).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 118000,
                receipt: 'receipt_42',
            }),
        );
        expect(result).toMatchObject({
            amount: 1180,
            amount_paise: 118000,
            base_amount: 1000,
            currency: 'INR',
            grand_total: 1180,
            gst_amount: 180,
            razorpay_order_id: 'order_single_123',
            service_ids: ['42'],
        });
    });

    it('creates a cart order with cart item ids', async () => {
        userServicesRepo.find.mockResolvedValue([
            { amount: '100.00', id: 11, service: { name: 'GST' } },
            { amount: '200.00', id: 12, service: { name: 'ITR' } },
        ] as UserServiceEntity[]);
        createOrderMock.mockResolvedValue({ id: 'order_cart_123' });

        const result = await service.createCartOrder(5);
        const calls = createOrderMock.mock.calls as Array<
            [
                {
                    amount: number;
                    notes: {
                        cart_item_ids: number[];
                        items_count: number;
                    };
                },
            ]
        >;
        const lastOrderRequest = calls[0]?.[0];

        expect(lastOrderRequest.amount).toBe(35400);
        expect(lastOrderRequest.notes.cart_item_ids).toEqual([11, 12]);
        expect(lastOrderRequest.notes.items_count).toBe(2);
        expect(result).toMatchObject({
            amount: 354,
            amount_paise: 35400,
            service_ids: ['11', '12'],
        });
    });

    it('marks payment successful after valid signature verification', async () => {
        const signature = crypto
            .createHmac('sha256', 'secret')
            .update('order_abc|payment_xyz')
            .digest('hex');

        const mockPayment = {
            id: 17,
            invoiceUniqueId: 'INV-17',
            orderUniqueId: 'ORD-17',
            status: 'pending',
            paymentStatus: 'pending',
            userServiceId: 5,
            notes: { user_service_id: 5 },
        };

        paymentsRepo.findOne.mockResolvedValue(mockPayment);
        paymentsRepo.save.mockResolvedValue(mockPayment);
        userServicesRepo.update.mockResolvedValue({ affected: 1 });
        userServicesRepo.findOne.mockResolvedValue(null); // no user service for notification

        const result = await service.verifyPayment({
            payment_id: 17,
            razorpay_order_id: 'order_abc',
            razorpay_payment_id: 'payment_xyz',
            razorpay_signature: signature,
        });

        expect(result).toEqual({
            invoice_unique_id: 'INV-17',
            order_unique_id: 'ORD-17',
            payment_id: 17,
            service_ids: ['5'],
            success: true,
        });
        expect(mockPayment.status).toBe('paid');
        expect(mockPayment.paymentStatus).toBe('paid');
        expect(paymentsRepo.save).toHaveBeenCalled();
    });

    it('maps payment history into dashboard order resources', async () => {
        const createdAt = new Date('2026-05-04T10:00:00.000Z');
        paymentsRepo.find = jest.fn().mockResolvedValue([
            {
                id: 91,
                amount: 354,
                createdAt,
                currency: 'INR',
                invoiceUniqueId: 'INV-91',
                notes: { cart_item_ids: [11, 12] },
                orderUniqueId: 'ORD-91',
                paymentProvider: 'razorpay',
                paymentProviderOrderId: 'order_cart_123',
                paymentProviderTransactionId: 'pay_cart_123',
                paymentStatus: 'paid',
                status: 'paid',
                userService: null,
                userServiceId: null,
            },
        ]);
        userServicesRepo.find.mockResolvedValue([
            {
                amount: '100.00',
                applicationUniqueId: 'APP-11',
                id: 11,
                service: { name: 'GST Registration' },
                serviceId: 201,
                status: 'paid',
            },
            {
                amount: '200.00',
                applicationUniqueId: 'APP-12',
                id: 12,
                service: { name: 'Income Tax Filing' },
                serviceId: 202,
                status: 'paid',
            },
        ]);

        const result = await service.myOrders(5);

        expect(result).toEqual([
            {
                amount: 354,
                created_at: createdAt,
                currency: 'INR',
                gst_amount: 54,
                id: 91,
                invoice_unique_id: 'INV-91',
                items: [
                    {
                        application_unique_id: 'APP-11',
                        id: 11,
                        name: 'GST Registration',
                        price: 100,
                        service_id: 201,
                        status: 'paid',
                    },
                    {
                        application_unique_id: 'APP-12',
                        id: 12,
                        name: 'Income Tax Filing',
                        price: 200,
                        service_id: 202,
                        status: 'paid',
                    },
                ],
                order_unique_id: 'ORD-91',
                payment_provider: 'razorpay',
                payment_provider_order_id: 'order_cart_123',
                payment_provider_transaction_id: 'pay_cart_123',
                payment_status: 'paid',
                status: 'paid',
                subtotal: 300,
            },
        ]);
    });

    it('builds invoice PDFs from paid payment records', async () => {
        const createdAt = new Date('2026-05-04T10:00:00.000Z');

        paymentsRepo.findOne.mockResolvedValue({
            amount: 354,
            createdAt,
            currency: 'INR',
            id: 91,
            invoiceUniqueId: 'INV-91',
            notes: { cart_item_ids: [11, 12] },
            orderUniqueId: 'ORD-91',
            paymentProvider: 'razorpay',
            paymentProviderOrderId: 'order_cart_123',
            paymentProviderTransactionId: 'pay_cart_123',
            paymentStatus: 'paid',
            status: 'paid',
            user: {
                email: 'customer@example.com',
                mobileNumber: '9999999999',
                name: 'Customer Name',
            },
            userService: null,
            userServiceId: null,
        });
        userServicesRepo.find.mockResolvedValue([
            {
                amount: '100.00',
                formData: { pricing_plan: 'Starter' },
                id: 11,
                service: { name: 'GST Registration' },
            },
            {
                amount: '200.00',
                formData: { pricing_plan: 'Premium' },
                id: 12,
                service: { name: 'Income Tax Filing' },
            },
        ]);

        const pdf = await service.downloadInvoice(5, 91);

        expect(pdf).toEqual(Buffer.from('pdf'));
        expect(pdfService.generatePdf).toHaveBeenCalledWith(
            'invoice',
            expect.objectContaining({
                date: '04 May 2026',
                invoiceId: 'INV-91',
                isPaid: true,
                orderId: 'ORD-91',
                payment: expect.objectContaining({
                    provider: 'razorpay',
                    providerOrderId: 'order_cart_123',
                    status: 'PAID',
                    transactionId: 'pay_cart_123',
                }),
                services: [
                    expect.objectContaining({
                        basePrice: 100,
                        gstAmount: 18,
                        name: 'GST Registration',
                        plan: 'Starter',
                        totalAmount: 118,
                    }),
                    expect.objectContaining({
                        basePrice: 200,
                        gstAmount: 36,
                        name: 'Income Tax Filing',
                        plan: 'Premium',
                        totalAmount: 236,
                    }),
                ],
                user: expect.objectContaining({
                    email: 'customer@example.com',
                    name: 'Customer Name',
                    phone: '9999999999',
                }),
            }),
        );
    });

    it('rejects invalid payment signatures', async () => {
        await expect(
            service.verifyPayment({
                payment_id: 17,
                razorpay_order_id: 'order_abc',
                razorpay_payment_id: 'payment_xyz',
                razorpay_signature: 'invalid',
            }),
        ).rejects.toThrow(BadRequestException);
    });
});
