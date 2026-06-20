import { BadRequestException } from '@nestjs/common';
import { UserServicesService } from './user-services.service';

describe('UserServicesService', () => {
  let prismaMock: any;
  let documentUploadServiceMock: any;
  let service: UserServicesService;

  beforeEach(() => {
    prismaMock = {
      enquiry: {
        create: jest.fn(),
      },
      service: {
        findUnique: jest.fn(),
      },
      userService: {
        delete: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUniqueOrThrow: jest.fn(),
      },
      payment: {
        deleteMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      serviceRequestDocument: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    documentUploadServiceMock = {
      deleteDocument: jest.fn(),
      uploadDocuments: jest.fn(),
    };

    service = new UserServicesService(
      prismaMock as any,
      {} as any,
      documentUploadServiceMock as any,
    );
  });

  it('queries all user services so newly added items appear immediately', async () => {
    await service.getMyServices(7);

    expect(prismaMock.userService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 7,
        },
      }),
    );
  });

  it('creates a fresh request when an older paid service already exists', async () => {
    const userId = 7;
    const dto = {
      form_data: {
        phone: '9999999999',
      },
      notes: 'Need this service again',
      service_id: 12,
    };
    const catalogService = {
      id: 12,
      documents: [],
      name: 'GST Registration',
      price: '1000.00',
      pricingPlans: [],
    };
    const user = {
      email: 'user@example.com',
      id: userId,
      mobileNumber: '9999999999',
      name: 'Repeat User',
    };
    const createdAt = new Date('2026-05-15T10:00:00.000Z');
    const hydratedRequest = {
      accountant: null,
      amount: '1000.00',
      applicationUniqueId: null,
      caNotes: null,
      certificateUrl: null,
      createdAt,
      documents: null,
      formData: dto.form_data,
      id: 301,
      notes: dto.notes,
      paymentStatus: 'CREATED',
      rejectionReason: null,
      requestDocuments: [],
      revisionNotes: null,
      service: {
        category: null,
        description: null,
        documents: [],
        extraDocuments: [],
        faqs: [],
        id: 12,
        link: null,
        longDescription: null,
        name: 'GST Registration',
        pricingPlans: [],
        price: '1000.00',
        requiredDocumentsList: [],
        serviceCategoryId: 1,
        shortDescription: null,
        slug: 'gst-registration',
      },
      serviceId: 12,
      status: 'payment_pending',
      submittedToCaAt: null,
      updateNote: null,
      updatedAt: createdAt,
      user: {
        accountant: null,
        accountantId: null,
        accountantUniqueId: null,
        address: null,
        city: null,
        createdAt,
        email: 'user@example.com',
        id: userId,
        isMobileVerified: true,
        mobileNumber: '9999999999',
        name: 'Repeat User',
        pincode: null,
        referralCode: null,
        regionalManager: null,
        rmId: null,
        rmUniqueId: null,
        role: 'user',
        state: null,
        updatedAt: createdAt,
      },
      userId,
      verified: false,
    };

    prismaMock.service.findUnique.mockResolvedValue(catalogService);
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(user);
    prismaMock.userService.findFirst.mockResolvedValue(null);
    prismaMock.userService.create.mockResolvedValue({ id: 301 });
    prismaMock.userService.findUniqueOrThrow.mockResolvedValue(hydratedRequest);

    const result = await service.applyForService(userId, dto as any);

    expect(prismaMock.userService.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          serviceId: 12,
          userId,
        }),
      }),
    );
    expect(prismaMock.userService.create).toHaveBeenCalledWith({
      data: {
        amount: '1000.00',
        formData: dto.form_data,
        notes: dto.notes,
        paymentStatus: 'CREATED',
        serviceId: 12,
        status: 'payment_pending',
        userId,
      },
    });
    expect(prismaMock.userService.update).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 301,
      payment_status: 'CREATED',
      service_id: 12,
      status: 'payment_pending',
    });
  });

  it('does not allow deleting a completed service request', async () => {
    prismaMock.userService.findUnique.mockResolvedValue({
      id: 88,
      requestDocuments: [],
      status: 'completed',
      userId: 7,
    });

    await expect(service.deleteMyService(7, 88)).rejects.toThrow(
      BadRequestException,
    );
    expect(prismaMock.payment.findMany).not.toHaveBeenCalled();
  });

  it('allows deleting an unpaid draft service request', async () => {
    prismaMock.userService.findUnique.mockResolvedValue({
      id: 89,
      requestDocuments: [],
      status: 'draft',
      userId: 7,
    });

    await expect(service.deleteMyService(7, 89)).resolves.toBe(true);

    expect(prismaMock.payment.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.userService.delete).toHaveBeenCalledWith({
      where: { id: 89 },
    });
  });

  it('filters admin applications by the selected local date and newest first', async () => {
    await service.getAllServices('all', '2026-06-20', -330);

    expect(prismaMock.userService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        where: {
          createdAt: {
            gte: new Date('2026-06-19T18:30:00.000Z'),
            lt: new Date('2026-06-20T18:30:00.000Z'),
          },
          status: {
            notIn: ['in_cart', 'payment_pending'],
          },
        },
      }),
    );
  });

  it('rejects an invalid admin application date', async () => {
    await expect(
      service.getAllServices('all', '2026-02-30', -330),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.userService.findMany).not.toHaveBeenCalled();
  });
});
