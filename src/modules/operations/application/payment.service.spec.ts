import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PdfService } from '../../../shared/services/pdf.service';
import { NotificationService } from '../../communication/notification.service';
import { PAYMENT_STATUS } from './payment-status';
import { PaymentService } from './payment.service';

const createOrderMock = jest.fn();

jest.mock('razorpay', () =>
  jest.fn().mockImplementation(() => ({
    orders: {
      create: createOrderMock,
    },
  })),
);

const flushAsyncWork = () => new Promise((resolve) => setImmediate(resolve));

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
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      payment: {
        create: jest.fn((args) => Promise.resolve({ id: 1, ...args.data })),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn((args) =>
          Promise.resolve({ id: args.where.id, ...args.data }),
        ),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
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
        if (key === 'RAZORPAY_WEBHOOK_SECRET') return 'webhook_secret';
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

  it('creates a single-service order as a draft payment attempt', async () => {
    prismaMock.userService.findFirst.mockResolvedValue({
      amount: '1000.00',
      id: 42,
      paymentStatus: PAYMENT_STATUS.CREATED,
      service: { name: 'GST Registration' },
      status: 'payment_pending',
      user: { id: 1, email: 'test@example.com' },
      userId: 1,
    });
    prismaMock.payment.findFirst.mockResolvedValue(null);
    createOrderMock.mockResolvedValue({ id: 'order_single_123' });

    const result = await service.createOrder(1, 42);

    expect(createOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 118000,
        receipt: 'receipt_42',
      }),
    );
    expect(prismaMock.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentProviderOrderId: 'order_single_123',
          paymentStatus: PAYMENT_STATUS.CREATED,
          status: PAYMENT_STATUS.CREATED,
        }),
      }),
    );
    expect(prismaMock.userService.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: {
        paymentStatus: PAYMENT_STATUS.CREATED,
        status: 'payment_pending',
      },
    });
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

  it('allows single-service checkout for items that are still in cart', async () => {
    prismaMock.userService.findFirst.mockResolvedValue({
      amount: '500.00',
      id: 77,
      paymentStatus: PAYMENT_STATUS.CREATED,
      service: { name: 'Company Registration' },
      status: 'in_cart',
      user: { id: 1, email: 'test@example.com' },
      userId: 1,
    });
    prismaMock.payment.findFirst.mockResolvedValue(null);
    createOrderMock.mockResolvedValue({ id: 'order_single_in_cart_123' });

    const result = await service.createOrder(1, 77);

    expect(createOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 59000,
        receipt: 'receipt_77',
      }),
    );
    expect(prismaMock.userService.update).toHaveBeenCalledWith({
      where: { id: 77 },
      data: {
        paymentStatus: PAYMENT_STATUS.CREATED,
        status: 'payment_pending',
      },
    });
    expect(result).toMatchObject({
      amount: 590,
      amount_paise: 59000,
      razorpay_order_id: 'order_single_in_cart_123',
      service_ids: ['77'],
    });
  });

  it('reuses a cart payment draft instead of creating duplicate orders on retry', async () => {
    prismaMock.userService.findMany.mockResolvedValue([
      { amount: '100.00', id: 11, service: { name: 'GST' } },
      { amount: '200.00', id: 12, service: { name: 'ITR' } },
    ]);
    prismaMock.payment.findFirst.mockResolvedValue({
      id: 55,
      orderUniqueId: 'ORD-55',
      invoiceUniqueId: 'INV-55',
      notes: { cart_item_ids: [11, 12] },
    });
    createOrderMock.mockResolvedValue({ id: 'order_cart_123' });

    const result = await service.createCartOrder(5);
    const lastOrderRequest = createOrderMock.mock.calls[0][0];

    expect(lastOrderRequest.amount).toBe(35400);
    expect(lastOrderRequest.notes.cart_item_ids).toEqual([11, 12]);
    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 55 },
        data: expect.objectContaining({
          paymentProviderOrderId: 'order_cart_123',
          paymentStatus: PAYMENT_STATUS.CREATED,
        }),
      }),
    );
    expect(result).toMatchObject({
      amount: 354,
      amount_paise: 35400,
      service_ids: ['11', '12'],
    });
  });

  it('marks payment successful after valid signature verification and activates the service', async () => {
    const signature = crypto
      .createHmac('sha256', 'secret')
      .update('order_abc|payment_xyz')
      .digest('hex');

    const paymentRecord = {
      id: 17,
      invoiceUniqueId: 'INV-17',
      orderUniqueId: 'ORD-17',
      paymentProviderOrderId: 'order_abc',
      paymentProviderTransactionId: null,
      paymentStatus: PAYMENT_STATUS.CREATED,
      status: PAYMENT_STATUS.CREATED,
      userServiceId: 5,
      notes: { user_service_id: 5 },
    };

    const hydratedPayment = {
      ...paymentRecord,
      amount: 118,
      createdAt: new Date('2026-05-09T09:00:00.000Z'),
      currency: 'INR',
      paymentProvider: 'razorpay',
      paymentProviderTransactionId: 'payment_xyz',
      paymentStatus: PAYMENT_STATUS.PAID,
      status: PAYMENT_STATUS.PAID,
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

    prismaMock.payment.findFirst
      .mockResolvedValueOnce(paymentRecord)
      .mockResolvedValueOnce(null);
    prismaMock.payment.findUnique.mockResolvedValue(hydratedPayment);
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

    const result = await service.verifyPayment(1, {
      payment_id: 17,
      razorpay_order_id: 'order_abc',
      razorpay_payment_id: 'payment_xyz',
      razorpay_signature: signature,
    });
    await flushAsyncWork();

    expect(prismaMock.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 17 }),
        data: expect.objectContaining({
          paymentStatus: PAYMENT_STATUS.PAID,
          status: PAYMENT_STATUS.PAID,
        }),
      }),
    );
    expect(prismaMock.userService.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          paymentStatus: PAYMENT_STATUS.PAID,
          status: 'paid',
        },
      }),
    );
    expect(pdfService.generatePdf).toHaveBeenCalledWith(
      'invoice',
      expect.objectContaining({
        company: expect.objectContaining({
          displayName: 'DoorstepFilings',
          name: 'FINTAXHUB INDIA PRIVATE LIMITED',
        }),
        invoiceId: 'INV-17',
        orderId: 'ORD-17',
        user: expect.objectContaining({
          email: 'buyer@example.com',
          name: 'Buyer Name',
        }),
      }),
    );
    expect(result).toEqual({
      invoice_unique_id: 'INV-17',
      order_unique_id: 'ORD-17',
      payment_id: 17,
      service_ids: ['5'],
      success: true,
    });
  });

  it('returns payment verification success without waiting for email delivery', async () => {
    const signature = crypto
      .createHmac('sha256', 'secret')
      .update('order_fast|payment_fast')
      .digest('hex');

    const paymentRecord = {
      id: 27,
      invoiceUniqueId: 'INV-27',
      orderUniqueId: 'ORD-27',
      paymentProviderOrderId: 'order_fast',
      paymentProviderTransactionId: null,
      paymentStatus: PAYMENT_STATUS.CREATED,
      status: PAYMENT_STATUS.CREATED,
      userServiceId: 15,
      notes: { user_service_id: 15 },
    };

    const hydratedPayment = {
      ...paymentRecord,
      amount: 236,
      createdAt: new Date('2026-05-15T08:30:00.000Z'),
      currency: 'INR',
      paymentProvider: 'razorpay',
      paymentProviderTransactionId: 'payment_fast',
      paymentStatus: PAYMENT_STATUS.PAID,
      status: PAYMENT_STATUS.PAID,
      user: {
        email: 'fast@example.com',
        mobileNumber: '9999999999',
        name: 'Fast Buyer',
      },
      userService: {
        amount: '200.00',
        formData: { pricing_plan: 'Pro' },
        id: 15,
        service: { name: 'GST Registration' },
      },
    };

    prismaMock.payment.findFirst
      .mockResolvedValueOnce(paymentRecord)
      .mockResolvedValueOnce(null);
    prismaMock.payment.findUnique.mockResolvedValue(hydratedPayment);
    prismaMock.userService.findMany.mockResolvedValue([
      {
        amount: '200.00',
        formData: { pricing_plan: 'Pro' },
        id: 15,
        service: { name: 'GST Registration' },
      },
    ]);
    (
      notificationService.sendPaymentSuccessNotification as jest.Mock
    ).mockReturnValue(new Promise(() => {}));

    const result = await service.verifyPayment(1, {
      payment_id: 27,
      razorpay_order_id: 'order_fast',
      razorpay_payment_id: 'payment_fast',
      razorpay_signature: signature,
    });
    await flushAsyncWork();

    expect(result).toEqual({
      invoice_unique_id: 'INV-27',
      order_unique_id: 'ORD-27',
      payment_id: 27,
      service_ids: ['15'],
      success: true,
    });
    expect(
      notificationService.sendPaymentSuccessNotification as jest.Mock,
    ).toHaveBeenCalled();
  });

  it('returns only paid orders in the dashboard order resource', async () => {
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
        paymentStatus: PAYMENT_STATUS.PAID,
        status: PAYMENT_STATUS.PAID,
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

    expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 5,
        }),
      }),
    );
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
        payment_status: PAYMENT_STATUS.PAID,
        status: PAYMENT_STATUS.PAID,
        subtotal: 300,
      },
    ]);
  });

  it('marks a dismissed checkout as cancelled without activating the service', async () => {
    prismaMock.payment.findFirst.mockResolvedValue({
      id: 33,
      notes: { user_service_id: 5 },
      paymentStatus: PAYMENT_STATUS.CREATED,
      status: PAYMENT_STATUS.CREATED,
      userId: 1,
      userServiceId: 5,
    });

    const result = await service.failPayment(
      1,
      33,
      'User closed Razorpay checkout',
    );

    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 33 },
        data: expect.objectContaining({
          paymentStatus: PAYMENT_STATUS.CANCELLED,
          status: PAYMENT_STATUS.CANCELLED,
        }),
      }),
    );
    expect(prismaMock.userService.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          paymentStatus: PAYMENT_STATUS.CANCELLED,
          status: 'payment_pending',
        },
      }),
    );
    expect(result).toEqual({
      success: true,
      status: PAYMENT_STATUS.CANCELLED,
    });
  });

  it('rejects invalid payment signatures', async () => {
    await expect(
      service.verifyPayment(1, {
        payment_id: 17,
        razorpay_order_id: 'order_abc',
        razorpay_payment_id: 'payment_xyz',
        razorpay_signature: 'invalid',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
