import { BadRequestException } from '@nestjs/common';
import { UserServicesService } from './user-services.service';

describe('UserServicesService', () => {
  let prismaMock: any;
  let documentUploadServiceMock: any;
  let service: UserServicesService;

  beforeEach(() => {
    prismaMock = {
      $transaction: jest.fn(async (callback: any) => callback(prismaMock)),
      enquiry: {
        create: jest.fn(),
      },
      service: {
        findUnique: jest.fn(),
      },
      userService: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUniqueOrThrow: jest.fn(),
      },
      payment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      serviceRequestDocument: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      serviceWorkflow: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      defaultServiceWorkflow: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      stage: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    documentUploadServiceMock = {
      deleteDocument: jest.fn(),
      uploadDocuments: jest.fn(),
    };

    service = new UserServicesService(
      prismaMock,
      {} as any,
      documentUploadServiceMock,
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
      clientMessage: null,
      createdAt,
      currentServiceWorkflowId: null,
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

    const result = await service.applyForService(userId, dto);

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

  it('updates the current request stage with a client message', async () => {
    const createdAt = new Date('2026-05-15T10:00:00.000Z');
    prismaMock.userService.findUniqueOrThrow
      .mockResolvedValueOnce({
        id: 55,
        serviceId: 12,
      })
      .mockResolvedValueOnce({
        accountant: null,
        amount: '1000.00',
        applicationUniqueId: 'APP-55',
        caNotes: 'internal note',
        certificateUrl: null,
        clientMessage: 'Documents received',
        createdAt,
        currentServiceWorkflowId: 201,
        documents: null,
        formData: null,
        id: 55,
        latestPayment: null,
        notes: null,
        paymentStatus: 'PAID',
        rejectionReason: null,
        requestDocuments: [],
        revisionNotes: null,
        service: {
          category: null,
          documents: [],
          id: 12,
          name: 'GST Registration',
          serviceCategoryId: 1,
          slug: 'gst-registration',
        },
        status: 'under_review',
        submittedToCaAt: null,
        updateNote: null,
        updatedAt: createdAt,
        user: {
          email: 'user@example.com',
          id: 7,
          name: 'Repeat User',
          role: 'user',
        },
        userId: 7,
        verified: false,
      });
    prismaMock.serviceWorkflow.findUnique.mockResolvedValue({
      id: 201,
      serviceId: 12,
    });
    prismaMock.serviceWorkflow.findMany.mockResolvedValue([
      {
        id: 201,
        isRequired: true,
        position: 1,
        serviceId: 12,
        stageId: 301,
        stage: {
          color: '#1d4ed8',
          id: 301,
          isActive: true,
          name: 'Documents Received',
          slug: 'documents-received',
        },
      },
    ]);

    const result = await service.updateRequestStage(55, {
      client_message: 'Documents received',
      service_workflow_id: 201,
    });

    expect(prismaMock.userService.update).toHaveBeenCalledWith({
      where: { id: 55 },
      data: expect.objectContaining({
        clientMessage: 'Documents received',
        currentServiceWorkflowId: 201,
      }),
    });
    expect(result).toMatchObject({
      client_message: 'Documents received',
      current_service_workflow_id: 201,
      progress: {
        mode: 'custom',
      },
    });
  });

  it('syncs the lifecycle status when a mapped workflow stage is selected', async () => {
    const createdAt = new Date('2026-05-15T10:00:00.000Z');

    prismaMock.userService.findUniqueOrThrow
      .mockResolvedValueOnce({
        id: 56,
        serviceId: 12,
        status: 'under_review',
      })
      .mockResolvedValueOnce({
        accountant: null,
        amount: '1000.00',
        applicationUniqueId: 'APP-56',
        caNotes: null,
        certificateUrl: null,
        clientMessage: null,
        createdAt,
        currentServiceWorkflowId: 202,
        documents: null,
        formData: null,
        id: 56,
        latestPayment: null,
        notes: null,
        paymentStatus: 'PAID',
        rejectionReason: null,
        requestDocuments: [],
        revisionNotes: null,
        service: {
          category: null,
          documents: [],
          id: 12,
          name: 'GST Registration',
          serviceCategoryId: 1,
          slug: 'gst-registration',
        },
        status: 'in_progress',
        submittedToCaAt: null,
        updateNote: null,
        updatedAt: createdAt,
        user: {
          email: 'user@example.com',
          id: 7,
          name: 'Repeat User',
          role: 'user',
        },
        userId: 7,
        verified: false,
      });
    prismaMock.serviceWorkflow.findUnique.mockResolvedValue({
      id: 202,
      serviceId: 12,
      stage: {
        color: '#ea580c',
        id: 302,
        isActive: true,
        name: 'Review',
        slug: 'review',
      },
    });
    prismaMock.serviceWorkflow.findMany.mockResolvedValue([
      {
        id: 202,
        isRequired: true,
        position: 2,
        serviceId: 12,
        stageId: 302,
        stage: {
          color: '#ea580c',
          id: 302,
          isActive: true,
          name: 'Review',
          slug: 'review',
        },
      },
    ]);

    const result = await service.updateRequestStage(56, {
      service_workflow_id: 202,
    });

    expect(prismaMock.userService.update).toHaveBeenCalledWith({
      where: { id: 56 },
      data: expect.objectContaining({
        currentServiceWorkflowId: 202,
        status: 'in_progress',
      }),
    });
    expect(result).toMatchObject({
      current_service_workflow_id: 202,
      status: 'in_progress',
    });
  });

  it('resolves quick target statuses when the exact stage slug is unavailable', async () => {
    const createdAt = new Date('2026-05-15T10:00:00.000Z');

    prismaMock.userService.findUniqueOrThrow
      .mockResolvedValueOnce({
        id: 57,
        serviceId: 12,
        status: 'in_progress',
      })
      .mockResolvedValueOnce({
        accountant: null,
        amount: '1000.00',
        applicationUniqueId: 'APP-57',
        caNotes: null,
        certificateUrl: null,
        clientMessage: null,
        createdAt,
        currentServiceWorkflowId: 202,
        documents: null,
        formData: null,
        id: 57,
        latestPayment: null,
        notes: null,
        paymentStatus: 'PAID',
        rejectionReason: null,
        requestDocuments: [],
        revisionNotes: null,
        service: {
          category: null,
          documents: [],
          id: 12,
          name: 'GST Registration',
          serviceCategoryId: 1,
          slug: 'gst-registration',
        },
        status: 'submitted_to_ca',
        submittedToCaAt: createdAt,
        updateNote: null,
        updatedAt: createdAt,
        user: {
          email: 'user@example.com',
          id: 7,
          name: 'Repeat User',
          role: 'user',
        },
        userId: 7,
        verified: false,
      });
    prismaMock.serviceWorkflow.findMany.mockResolvedValue([
      {
        id: 202,
        isRequired: true,
        position: 2,
        serviceId: 12,
        stageId: 302,
        stage: {
          color: '#ea580c',
          id: 302,
          isActive: true,
          name: 'Review',
          slug: 'review',
        },
      },
    ]);
    prismaMock.serviceWorkflow.findUnique.mockResolvedValue({
      id: 202,
      serviceId: 12,
      stage: {
        color: '#ea580c',
        id: 302,
        isActive: true,
        name: 'Review',
        slug: 'review',
      },
    });

    const result = await service.updateRequestStage(57, {
      service_workflow_id: null,
      target_status: 'submitted_to_ca',
    });

    expect(prismaMock.userService.update).toHaveBeenCalledWith({
      where: { id: 57 },
      data: expect.objectContaining({
        currentServiceWorkflowId: 202,
        currentStageUpdatedAt: expect.any(Date),
        status: 'submitted_to_ca',
      }),
    });
    expect(result).toMatchObject({
      current_service_workflow_id: 202,
      status: 'submitted_to_ca',
    });
  });

  it('allows moving a submitted CA request back to applied', async () => {
    const createdAt = new Date('2026-05-15T10:00:00.000Z');

    prismaMock.userService.findUniqueOrThrow
      .mockResolvedValueOnce({
        certificateUrl: null,
        id: 78,
        serviceId: 12,
        status: 'submitted_to_ca',
      })
      .mockResolvedValueOnce({
        accountant: null,
        amount: '1000.00',
        applicationUniqueId: 'APP-78',
        caNotes: null,
        certificateUrl: null,
        clientMessage: null,
        createdAt,
        currentServiceWorkflowId: null,
        documents: null,
        formData: null,
        id: 78,
        latestPayment: null,
        notes: null,
        paymentStatus: 'PAID',
        rejectionReason: null,
        requestDocuments: [],
        revisionNotes: null,
        service: {
          category: null,
          documents: [],
          id: 12,
          name: 'GST Registration',
          serviceCategoryId: 1,
          slug: 'gst-registration',
        },
        status: 'applied',
        submittedToCaAt: createdAt,
        updateNote: null,
        updatedAt: createdAt,
        user: {
          email: 'user@example.com',
          id: 7,
          name: 'Repeat User',
          role: 'user',
        },
        userId: 7,
        verified: false,
      });
    prismaMock.serviceWorkflow.findMany.mockResolvedValue([
      {
        id: 101,
        isRequired: true,
        position: 1,
        serviceId: 12,
        stageId: 301,
        stage: {
          color: '#0f766e',
          id: 301,
          isActive: true,
          name: 'Start',
          slug: 'start',
        },
      },
    ]);

    const result = await service.updateApplicationStatus(78, {
      status: 'applied',
    });

    expect(prismaMock.userService.update).toHaveBeenCalledWith({
      where: { id: 78 },
      data: expect.objectContaining({
        currentServiceWorkflowId: 101,
        currentStageUpdatedAt: expect.any(Date),
        status: 'applied',
      }),
    });
    expect(result).toMatchObject({
      id: 78,
      status: 'applied',
    });
  });

  it('verifies RM ownership before assigning an accountant to a request', async () => {
    prismaMock.userService.findFirstOrThrow.mockResolvedValue({
      id: 91,
    });
    prismaMock.userService.update.mockResolvedValue({
      id: 91,
      accountantId: 12,
    });
    prismaMock.userService.findUniqueOrThrow.mockResolvedValue({
      accountant: { id: 12, role: 'accountant' },
      id: 91,
      service: {
        category: null,
        id: 5,
        name: 'GST Registration',
        serviceCategoryId: 1,
        slug: 'gst-registration',
      },
      status: 'under_review',
      user: {
        id: 7,
        role: 'user',
        email: 'user@example.com',
        name: 'Repeat User',
      },
    });

    await service.assignAccountantForRmRequest(6, 91, 12);

    expect(prismaMock.userService.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        id: 91,
        user: {
          rmId: 6,
        },
      },
    });
  });

  it('keeps completed services on their archived workflow snapshot after a workflow update', async () => {
    const request = {
      currentServiceWorkflowId: 1102,
      id: 41,
      service: {
        id: 12,
        serviceWorkflows: [],
      },
      serviceId: 12,
      status: 'completed',
    } as any;

    prismaMock.serviceWorkflow.findMany
      .mockResolvedValueOnce([
        {
          id: 101,
          isRequired: true,
          position: 1,
          serviceId: 12,
          stageId: 301,
          stage: {
            color: '#0f766e',
            id: 301,
            isActive: true,
            name: 'New Start',
            slug: 'new-start',
          },
        },
        {
          id: 102,
          isRequired: true,
          position: 2,
          serviceId: 12,
          stageId: 302,
          stage: {
            color: '#ea580c',
            id: 302,
            isActive: true,
            name: 'New Review',
            slug: 'new-review',
          },
        },
        {
          id: 1101,
          isRequired: true,
          position: 1001,
          serviceId: 12,
          stageId: 401,
          stage: {
            color: '#1d4ed8',
            id: 401,
            isActive: true,
            name: 'Old Start',
            slug: 'old-start',
          },
        },
        {
          id: 1102,
          isRequired: true,
          position: 1002,
          serviceId: 12,
          stageId: 402,
          stage: {
            color: '#2563eb',
            id: 402,
            isActive: true,
            name: 'Old Review',
            slug: 'old-review',
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 1102,
          isRequired: true,
          position: 1002,
          serviceId: 12,
          stageId: 402,
          stage: {
            color: '#2563eb',
            id: 402,
            isActive: true,
            name: 'Old Review',
            slug: 'old-review',
          },
        },
      ]);
    prismaMock.defaultServiceWorkflow.findMany.mockResolvedValue([
      { position: 1, stageId: 301 },
      { position: 2, stageId: 302 },
    ]);

    await service.populateStageProgress(request);

    expect(request.currentWorkflow).toMatchObject({
      id: 1102,
      position: 2,
      stage: {
        slug: 'old-review',
      },
    });
    expect(request.service.serviceWorkflows).toEqual([
      expect.objectContaining({
        id: 1101,
        position: 1,
        stage: expect.objectContaining({
          slug: 'old-start',
        }),
      }),
      expect.objectContaining({
        id: 1102,
        position: 2,
        stage: expect.objectContaining({
          slug: 'old-review',
        }),
      }),
    ]);
    expect(request.hasWorkflow).toBe(true);
  });
});
