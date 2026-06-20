import { AdminService } from './admin.service';

describe('AdminService RM ID generation', () => {
  let prismaMock: any;
  let notificationServiceMock: any;
  let documentUploadServiceMock: any;
  let service: AdminService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-07T00:00:00Z'));

    prismaMock = {
      user: {
        count: jest.fn(),
        create: jest.fn(({ data }) => Promise.resolve({ id: 99, ...data })),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(({ data }) => Promise.resolve({ id: 5, ...data })),
      },
      serviceRequestDocument: {
        findFirst: jest.fn(),
      },
    };
    notificationServiceMock = {
      sendWelcomeNotification: jest.fn().mockResolvedValue(undefined),
    };
    documentUploadServiceMock = {
      replaceDocument: jest.fn(),
    };

    service = new AdminService(
      prismaMock as any,
      {} as any,
      notificationServiceMock as any,
      documentUploadServiceMock as any,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates relationship managers with the next serial for the location and year', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { rmUniqueId: 'RMMHMUM260001' },
      { rmUniqueId: 'RMMHMUM260007' },
    ]);

    await service.storeUser({
      city: 'Mumbai',
      email: 'rm@example.com',
      name: 'Relationship Manager',
      pincode: '400001',
      role: 'regional_manager',
      state: 'Maharashtra',
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        city: 'Mumbai',
        pincode: '400001',
        rmUniqueId: 'RMMHMUM260008',
        state: 'Maharashtra',
      }),
    });
  });

  it('uses existing user location when promoting a user to relationship manager', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({
      accountantUniqueId: null,
      address: 'Fort',
      assignedAccountants: [],
      assignedUsers: [],
      city: 'Mumbai',
      id: 5,
      pincode: '400001',
      rmUniqueId: null,
      role: 'user',
      state: 'Maharashtra',
    });

    await service.updateRole(5, { role: 'regional_manager' });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        rmUniqueId: 'RMMHMUM260001',
        role: 'regional_manager',
      }),
      where: { id: 5 },
    });
  });

  it('creates a corrected client-approval version and retires the rejected version', async () => {
    prismaMock.serviceRequestDocument.findFirst.mockResolvedValue({
      id: 77,
      userServiceId: 30,
      uploadedBy: {
        id: 8,
        role: 'accountant',
      },
      documentCategory: null,
      documentName: 'Review Report',
      documentType: 'client',
      fileName: 'review-v1.pdf',
      notes: 'Client (Krishna): Please correct this',
      serviceDocumentId: null,
      status: 'rejected',
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      name: 'Super Admin',
    });
    documentUploadServiceMock.replaceDocument.mockResolvedValue({ id: 77 });
    jest
      .spyOn(service, 'getServiceApplication')
      .mockResolvedValue({ id: 30 } as any);

    const file = {
      buffer: Buffer.from('corrected pdf'),
      mimetype: 'application/pdf',
      originalname: 'review-v2.pdf',
      size: 1024,
    };

    await service.replaceClientApprovalDocument(
      1,
      30,
      77,
      file,
      'Corrected as requested',
    );

    expect(documentUploadServiceMock.replaceDocument).toHaveBeenCalledWith(
      77,
      1,
      file,
      'Client (Krishna): Please correct this\n\nAdmin (Super Admin): Corrected as requested',
    );
  });
});
