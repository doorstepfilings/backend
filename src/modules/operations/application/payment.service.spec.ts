import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentService } from './payment.service';
import { PdfService } from '../../../shared/services/pdf.service';
import { NotificationService } from '../../communication/notification.service';
import { BadRequestException } from '@nestjs/common';

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
    let prismaMock: any;
    let notificationService: Partial<NotificationService>;
    let pdfService: any;
    let service: PaymentService;

    beforeEach(() => {
        createOrderMock.mockReset();
        prismaMock = {
            userService: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                findUniqueOrThrow: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
            },
            payment: {
                create: jest.fn((args) => Promise.resolve({ id: 1, ...args.data })),
                findMany: jest.fn(),
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn((args) => Promise.resolve({ id: args.where.id, ...args.data })),
                updateMany: jest.fn(),
            },
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
            prismaMock as any,
            configService,
            notificationService as NotificationService,
            pdfService as PdfService,
        );
    });

    it('creates a single-service order with explicit totals', async () => {
        prismaMock.userService.findUnique.mockResolvedValue({
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
        prismaMock.userService.findMany.mockResolvedValue([
            { amount: '100.00', id: 11, service: { name: 'GST' } },
            { amount: '200.00', id: 12, service: { name: 'ITR' } },
        ]);
        createOrderMock.mockResolvedValue({ id: 'order_cart_123' });

        const result = await service.createCartOrder(5);
        const lastOrderRequest = createOrderMock.mock.calls[0][0];

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

        prismaMock.payment.findUnique
            .mockResolvedValueOnce(mockPayment)
            .mockResolvedValueOnce({ ...mockPayment, user: null, userService: null });
        
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
        expect(prismaMock.payment.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 17 },
            data: expect.objectContaining({ status: 'paid' })
        }));
    });

    it('emails a professional invoice PDF after successful payment', async () => {
        const signature = crypto
            .createHmac('sha256', 'secret')
            .update('order_invoice|payment_invoice')
            .digest('hex');

        const paymentRecord = {
            id: 18,
            amount: 118,
            createdAt: new Date('2026-05-09T09:00:00.000Z'),
            currency: 'INR',
            invoiceUniqueId: 'INV-18',
            notes: { user_service_id: 5 },
            orderUniqueId: 'ORD-18',
            paymentProvider: 'razorpay',
            paymentProviderOrderId: 'order_invoice',
            paymentProviderTransactionId: null,
            paymentStatus: 'pending',
            status: 'pending',
            userServiceId: 5,
        };
        const hydratedPayment = {
            ...paymentRecord,
            paymentProviderTransactionId: 'payment_invoice',
            paymentStatus: 'paid',
            status: 'paid',
            user: {
                email: 'buyer@example.com',
                mobileNumber: '9999999999',
                name: 'Buyer Name',
            },
            userService: {
                amount: '100.00',
                formData: { pricing_plan: 'Starter' },
                id: 5,
                service: { name: 'GST Registration' },
            },
        };

        prismaMock.payment.findUnique
            .mockResolvedValueOnce(paymentRecord)
            .mockResolvedValueOnce(hydratedPayment);
        prismaMock.userService.findMany.mockResolvedValue([
            {
                amount: '100.00',
                formData: { pricing_plan: 'Starter' },
                id: 5,
                service: { name: 'GST Registration' },
            },
        ]);
        (
            notificationService.sendPaymentSuccessNotification as jest.Mock
        ).mockResolvedValue(undefined);

        await service.verifyPayment({
            payment_id: 18,
            razorpay_order_id: 'order_invoice',
            razorpay_payment_id: 'payment_invoice',
            razorpay_signature: signature,
        });

        expect(pdfService.generatePdf).toHaveBeenCalledWith(
            'invoice',
            expect.objectContaining({
                invoiceId: 'INV-18',
                orderId: 'ORD-18',
                user: expect.objectContaining({
                    email: 'buyer@example.com',
                    name: 'Buyer Name',
                }),
            }),
        );
    });

    it('maps payment history into dashboard order resources', async () => {
        const createdAt = new Date('2026-05-04T10:00:00.000Z');
        prismaMock.payment.findMany.mockResolvedValue([
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
        prismaMock.userService.findMany.mockResolvedValue([
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
