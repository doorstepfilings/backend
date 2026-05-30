import { AdminService } from './admin.service';

describe('AdminService', () => {
  let prismaMock: any;
  let userServicesServiceMock: any;
  let service: AdminService;

  beforeEach(() => {
    prismaMock = {
      service: {
        findUniqueOrThrow: jest.fn(),
      },
      serviceCategory: {
        findUniqueOrThrow: jest.fn(),
      },
      enquiry: {
        delete: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirstOrThrow: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      userService: {
        aggregate: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };
    userServicesServiceMock = {
      populateLatestPayments: jest.fn(),
      populateRequestDocuments: jest.fn(),
      populateStageProgress: jest.fn(),
    };

    service = new AdminService(
      prismaMock,
      userServicesServiceMock,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('normalizes string application ids before loading service application details', async () => {
    const createdAt = new Date('2026-05-22T10:00:00.000Z');
    prismaMock.userService.findUniqueOrThrow.mockResolvedValue({
      accountant: null,
      amount: '499.00',
      applicationUniqueId: 'APP-001',
      caNotes: null,
      certificateUrl: null,
      clientMessage: null,
      createdAt,
      currentServiceWorkflowId: null,
      documents: null,
      formData: null,
      id: 1,
      latestPayment: null,
      notes: null,
      paymentStatus: 'PAID',
      rejectionReason: null,
      requestDocuments: [],
      revisionNotes: null,
      service: {
        category: null,
        documents: [],
        extraDocuments: [],
        faqs: [],
        id: 3,
        link: '/service/gst-registration',
        longDescription: null,
        name: 'GST Registration',
        pricingPlans: [],
        price: '499.00',
        requiredDocumentsList: [],
        serviceCategoryId: 1,
        shortDescription: null,
        slug: 'gst-registration',
      },
      serviceId: 3,
      status: 'under_review',
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
        id: 9,
        isMobileVerified: true,
        mobileNumber: '9999999999',
        name: 'User',
        pincode: null,
        referralCode: null,
        regionalManager: null,
        rmId: null,
        rmUniqueId: null,
        role: 'user',
        state: null,
        updatedAt: createdAt,
      },
      userId: 9,
      verified: false,
    });

    const result = await service.getServiceApplication('1' as any);

    expect(prismaMock.userService.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        user: true,
        service: { include: { category: true } },
        accountant: true,
      },
    });
    expect(result).toMatchObject({
      id: 1,
      service_id: 3,
      status: 'under_review',
    });
  });

  it('normalizes string RM ids before loading RM details', async () => {
    prismaMock.user.findFirstOrThrow.mockResolvedValue({
      assignedUsers: [{ id: 11 }, { id: 12 }],
      id: 5,
      password: 'hashed-secret',
      role: 'regional_manager',
    });
    prismaMock.userService.count.mockResolvedValue(4);
    prismaMock.userService.aggregate.mockResolvedValue({
      _sum: { amount: 2500 },
    });

    const result = await service.getRegionalManagerDetails('5' as any);

    expect(prismaMock.user.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: 5, role: 'regional_manager' },
      include: { assignedUsers: { include: { accountant: true } } },
    });
    expect(result).toMatchObject({
      active_services_count: 4,
      performance_score: 'Needs Improvement',
      total_revenue: 2500,
    });
    expect(result.password).toBeUndefined();
  });

  it('normalizes string user ids before loading user details', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({
      id: 2,
      password: 'hashed-secret',
      role: 'user',
    });

    const result = await service.getUserDetails('2' as any);

    expect(prismaMock.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 2 },
      include: {
        regionalManager: true,
        accountant: true,
        assignedUsers: true,
        assignedAccountants: true,
      },
    });
    expect((result as any).password).toBeUndefined();
  });
});
