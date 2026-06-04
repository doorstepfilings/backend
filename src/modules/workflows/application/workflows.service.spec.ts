import { ServiceUnavailableException } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';

describe('WorkflowsService', () => {
  let prismaMock: any;
  let workflowLogsServiceMock: any;
  let service: WorkflowsService;

  beforeEach(() => {
    prismaMock = {
      $transaction: jest.fn(async (callback: any) => callback(prismaMock)),
      defaultServiceWorkflow: {
        count: jest.fn().mockResolvedValue(0),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
      service: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      serviceWorkflow: {
        create: jest.fn(),
        createMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      stage: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      userService: {
        count: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    workflowLogsServiceMock = {
      record: jest.fn(),
    };

    service = new WorkflowsService(prismaMock, workflowLogsServiceMock);
  });

  it('replaces the default workflow template with ordered active stages', async () => {
    prismaMock.stage.findMany.mockResolvedValue([
      { id: 200, isActive: true, slug: 'payment-verification' },
      { id: 201, isActive: true, slug: 'start' },
      { id: 203, isActive: true, slug: 'cancelled' },
      { id: 204, isActive: true, slug: 'completed' },
    ]);
    prismaMock.defaultServiceWorkflow.findMany.mockResolvedValue([
      {
        id: 1,
        isRequired: true,
        position: 1,
        stage: {
          id: 200,
          name: 'Payment Verification',
          slug: 'payment-verification',
          color: '#2563eb',
        },
        stageId: 200,
      },
      {
        id: 2,
        isRequired: true,
        position: 2,
        stage: { id: 201, name: 'Start', slug: 'start', color: '#0f766e' },
        stageId: 201,
      },
      {
        id: 3,
        isRequired: true,
        position: 3,
        stage: {
          id: 203,
          name: 'Cancelled',
          slug: 'cancelled',
          color: '#64748b',
        },
        stageId: 203,
      },
      {
        id: 4,
        isRequired: true,
        position: 4,
        stage: {
          id: 204,
          name: 'Completed',
          slug: 'completed',
          color: '#16a34a',
        },
        stageId: 204,
      },
    ]);

    const result = await service.replaceDefaultWorkflow(
      {
        items: [
          { stageId: 204, position: 4, isRequired: true },
          { stageId: 203, position: 3, isRequired: true },
          { stageId: 200, position: 1, isRequired: true },
          { stageId: 201, position: 2, isRequired: true },
        ],
      },
      99,
    );

    expect(prismaMock.defaultServiceWorkflow.deleteMany).toHaveBeenCalledWith(
      {},
    );
    expect(prismaMock.defaultServiceWorkflow.createMany).toHaveBeenCalledWith({
      data: [
        { isRequired: true, position: 1, stageId: 200 },
        { isRequired: true, position: 2, stageId: 201 },
        { isRequired: true, position: 3, stageId: 203 },
        { isRequired: true, position: 4, stageId: 204 },
      ],
    });
    expect(workflowLogsServiceMock.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'workflow.default.replace',
        actorId: 99,
      }),
      prismaMock,
    );
    expect(result).toEqual([
      expect.objectContaining({
        position: 1,
        stage_id: 200,
      }),
      expect.objectContaining({
        position: 2,
        stage_id: 201,
      }),
      expect.objectContaining({
        position: 3,
        stage_id: 203,
      }),
      expect.objectContaining({
        position: 4,
        stage_id: 204,
      }),
    ]);
  });

  it('falls back to the legacy default workflow stages when the template table is missing', async () => {
    prismaMock.defaultServiceWorkflow.findMany.mockRejectedValue({
      code: 'P2021',
      meta: {
        table: 'default_service_workflows',
      },
    });
    prismaMock.stage.findMany.mockResolvedValue([
      {
        color: '#2563eb',
        createdAt: new Date('2026-05-20T09:00:00.000Z'),
        id: 200,
        isActive: true,
        isDefault: true,
        name: 'Payment Verification',
        slug: 'payment-verification',
        updatedAt: new Date('2026-05-20T09:00:00.000Z'),
      },
      {
        color: '#0f766e',
        createdAt: new Date('2026-05-20T09:00:00.000Z'),
        id: 201,
        isActive: true,
        isDefault: true,
        name: 'Start',
        slug: 'start',
        updatedAt: new Date('2026-05-20T09:00:00.000Z'),
      },
      {
        color: '#64748b',
        createdAt: new Date('2026-05-20T09:00:00.000Z'),
        id: 203,
        isActive: true,
        isDefault: true,
        name: 'Cancelled',
        slug: 'cancelled',
        updatedAt: new Date('2026-05-20T09:00:00.000Z'),
      },
      {
        color: '#16a34a',
        createdAt: new Date('2026-05-20T09:00:00.000Z'),
        id: 204,
        isActive: true,
        isDefault: true,
        name: 'Completed',
        slug: 'completed',
        updatedAt: new Date('2026-05-20T09:00:00.000Z'),
      },
    ]);

    const result = await service.listDefaultWorkflow();

    expect(prismaMock.stage.findMany).toHaveBeenCalledWith({
      where: {
        slug: {
          in: ['payment-verification', 'start', 'cancelled', 'completed'],
        },
      },
    });
    expect(result.map((item: any) => [item.position, item.stage_id])).toEqual([
      [1, 200],
      [2, 201],
      [3, 203],
      [4, 204],
    ]);
  });

  it('applies the legacy default workflow when the template table is missing', async () => {
    prismaMock.defaultServiceWorkflow.findMany.mockRejectedValue({
      code: 'P2021',
      meta: {
        table: 'default_service_workflows',
      },
    });
    prismaMock.stage.findMany.mockResolvedValue([
      {
        color: '#2563eb',
        createdAt: new Date('2026-05-20T09:00:00.000Z'),
        id: 200,
        isActive: true,
        isDefault: true,
        name: 'Payment Verification',
        slug: 'payment-verification',
        updatedAt: new Date('2026-05-20T09:00:00.000Z'),
      },
      {
        color: '#0f766e',
        createdAt: new Date('2026-05-20T09:00:00.000Z'),
        id: 201,
        isActive: true,
        isDefault: true,
        name: 'Start',
        slug: 'start',
        updatedAt: new Date('2026-05-20T09:00:00.000Z'),
      },
      {
        color: '#64748b',
        createdAt: new Date('2026-05-20T09:00:00.000Z'),
        id: 203,
        isActive: true,
        isDefault: true,
        name: 'Cancelled',
        slug: 'cancelled',
        updatedAt: new Date('2026-05-20T09:00:00.000Z'),
      },
      {
        color: '#16a34a',
        createdAt: new Date('2026-05-20T09:00:00.000Z'),
        id: 204,
        isActive: true,
        isDefault: true,
        name: 'Completed',
        slug: 'completed',
        updatedAt: new Date('2026-05-20T09:00:00.000Z'),
      },
    ]);
    prismaMock.service.findMany.mockResolvedValue([{ id: 10 }]);
    prismaMock.serviceWorkflow.findMany.mockResolvedValue([]);
    prismaMock.userService.findMany.mockResolvedValue([]);

    const result = await service.applyDefaultWorkflow(
      {
        serviceIds: [10],
      },
      99,
    );

    expect(prismaMock.serviceWorkflow.createMany).toHaveBeenCalledWith({
      data: [
        { isRequired: true, position: 1, serviceId: 10, stageId: 200 },
        { isRequired: true, position: 2, serviceId: 10, stageId: 201 },
        { isRequired: true, position: 3, serviceId: 10, stageId: 203 },
        { isRequired: true, position: 4, serviceId: 10, stageId: 204 },
      ],
    });
    expect(result).toMatchObject({
      applied_service_count: 1,
      applied_service_ids: [10],
    });
  });

  it('returns a clear error when replacing the default workflow without the template table', async () => {
    prismaMock.stage.findMany.mockResolvedValue([
      { id: 200, isActive: true, slug: 'payment-verification' },
      { id: 201, isActive: true, slug: 'start' },
      { id: 203, isActive: true, slug: 'cancelled' },
      { id: 204, isActive: true, slug: 'completed' },
    ]);
    prismaMock.defaultServiceWorkflow.deleteMany.mockRejectedValue({
      code: 'P2021',
      meta: {
        table: 'default_service_workflows',
      },
    });

    await expect(
      service.replaceDefaultWorkflow(
        {
          items: [
            { stageId: 200 },
            { stageId: 201 },
            { stageId: 203 },
            { stageId: 204 },
          ],
        },
        99,
      ),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('applies the default workflow only to services that do not already have custom stages', async () => {
    prismaMock.defaultServiceWorkflow.findMany.mockResolvedValue([
      { stageId: 201, position: 1, isRequired: true },
      { stageId: 202, position: 2, isRequired: true },
    ]);
    prismaMock.service.findMany.mockResolvedValue([
      { id: 10 },
      { id: 11 },
      { id: 12 },
    ]);
    prismaMock.serviceWorkflow.findMany.mockImplementation(
      async (args: any) => {
        const serviceId = args?.where?.serviceId;
        if (serviceId === 11) {
          return [{ id: 501, serviceId: 11 }];
        }
        return [];
      },
    );
    prismaMock.userService.findMany.mockResolvedValue([]);

    const result = await service.applyDefaultWorkflow(
      {
        serviceIds: [10, 11, 12],
      },
      99,
    );

    expect(prismaMock.serviceWorkflow.createMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.serviceWorkflow.createMany).toHaveBeenNthCalledWith(1, {
      data: [
        { isRequired: true, position: 1, serviceId: 10, stageId: 201 },
        { isRequired: true, position: 2, serviceId: 10, stageId: 202 },
      ],
    });
    expect(prismaMock.serviceWorkflow.createMany).toHaveBeenNthCalledWith(2, {
      data: [
        { isRequired: true, position: 1, serviceId: 12, stageId: 201 },
        { isRequired: true, position: 2, serviceId: 12, stageId: 202 },
      ],
    });
    expect(result).toMatchObject({
      applied_service_count: 2,
      applied_service_ids: [10, 12],
      requested_service_count: 3,
      skipped_service_count: 1,
      skipped_service_ids: [11],
    });
  });

  it('overwrites workflows for services that still have active requests by remapping them onto the new stages', async () => {
    prismaMock.defaultServiceWorkflow.findMany.mockResolvedValue([
      {
        isRequired: true,
        position: 1,
        stage: { id: 201, slug: 'start' },
        stageId: 201,
      },
      {
        isRequired: true,
        position: 2,
        stage: { id: 202, slug: 'review' },
        stageId: 202,
      },
    ]);
    prismaMock.service.findMany.mockResolvedValue([{ id: 10 }]);
    prismaMock.serviceWorkflow.findMany
      .mockResolvedValueOnce([{ id: 501, serviceId: 10 }])
      .mockResolvedValueOnce([
        { id: 501, serviceId: 10, stageId: 203, position: 1 },
      ])
      .mockResolvedValueOnce([
        {
          id: 801,
          position: 1,
          serviceId: 10,
          stage: { slug: 'start' },
          stageId: 201,
        },
        {
          id: 802,
          position: 2,
          serviceId: 10,
          stage: { slug: 'review' },
          stageId: 202,
        },
      ]);
    prismaMock.userService.findMany.mockResolvedValue([
      {
        id: 91,
        currentServiceWorkflowId: 501,
        serviceId: 10,
        status: 'in_progress',
      },
    ]);
    prismaMock.userService.count.mockResolvedValue(0);
    prismaMock.serviceWorkflow.update = jest.fn();
    prismaMock.serviceWorkflow.create = jest
      .fn()
      .mockResolvedValue({ id: 802 });
    jest.spyOn(service as any, 'isCustomWorkflow').mockReturnValue(false);

    const result = await service.applyDefaultWorkflow(
      {
        overwrite: true,
        serviceIds: [10],
      },
      99,
    );

    expect(prismaMock.serviceWorkflow.update).toHaveBeenCalledWith({
      where: { id: 501 },
      data: { position: -1 },
    });
    expect(prismaMock.serviceWorkflow.delete).toHaveBeenCalledWith({
      where: { id: 501 },
    });
    expect(prismaMock.serviceWorkflow.create).toHaveBeenNthCalledWith(1, {
      data: {
        serviceId: 10,
        stageId: 201,
        position: 1,
        isRequired: true,
      },
    });
    expect(prismaMock.serviceWorkflow.create).toHaveBeenNthCalledWith(2, {
      data: {
        serviceId: 10,
        stageId: 202,
        position: 2,
        isRequired: true,
      },
    });
    expect(prismaMock.userService.update).toHaveBeenCalledWith({
      where: { id: 91 },
      data: expect.objectContaining({
        currentServiceWorkflowId: 802,
      }),
    });
    expect(result).toMatchObject({
      applied_service_count: 1,
      applied_service_ids: [10],
      blocked_service_ids: [],
      skipped_service_count: 0,
    });
  });

  it('overwrites workflows for services whose existing requests are already completed without changing their historical stage', async () => {
    prismaMock.defaultServiceWorkflow.findMany.mockResolvedValue([
      {
        isRequired: true,
        position: 1,
        stage: { id: 201, slug: 'start' },
        stageId: 201,
      },
      {
        isRequired: true,
        position: 2,
        stage: { id: 204, slug: 'completed' },
        stageId: 204,
      },
    ]);
    prismaMock.service.findMany.mockResolvedValue([{ id: 10 }]);
    prismaMock.serviceWorkflow.findMany
      .mockResolvedValueOnce([{ id: 501, serviceId: 10 }])
      .mockResolvedValueOnce([
        {
          id: 501,
          isRequired: true,
          serviceId: 10,
          stageId: 203,
          position: 1,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 801,
          position: 1,
          serviceId: 10,
          stage: { slug: 'start' },
          stageId: 201,
        },
        {
          id: 802,
          position: 2,
          serviceId: 10,
          stage: { slug: 'completed' },
          stageId: 204,
        },
      ]);
    prismaMock.userService.findMany.mockResolvedValue([
      {
        id: 91,
        currentServiceWorkflowId: 501,
        serviceId: 10,
        status: 'completed',
      },
    ]);
    prismaMock.userService.count.mockResolvedValue(0);
    prismaMock.serviceWorkflow.update = jest.fn();
    prismaMock.serviceWorkflow.create = jest
      .fn()
      .mockResolvedValueOnce({ id: 901 })
      .mockResolvedValueOnce({ id: 801 })
      .mockResolvedValueOnce({ id: 802 });
    jest.spyOn(service as any, 'isCustomWorkflow').mockReturnValue(false);

    const result = await service.applyDefaultWorkflow(
      {
        overwrite: true,
        serviceIds: [10],
      },
      99,
    );

    expect(prismaMock.serviceWorkflow.create).toHaveBeenNthCalledWith(1, {
      data: {
        isRequired: true,
        position: 1001,
        serviceId: 10,
        stageId: 203,
      },
      select: {
        id: true,
      },
    });
    expect(prismaMock.userService.update).toHaveBeenCalledWith({
      where: { id: 91 },
      data: {
        currentServiceWorkflowId: 901,
      },
    });
    expect(prismaMock.serviceWorkflow.delete).toHaveBeenCalledWith({
      where: { id: 501 },
    });
    expect(result).toMatchObject({
      applied_service_count: 1,
      applied_service_ids: [10],
      blocked_service_ids: [],
      skipped_service_count: 0,
    });
  });

  it('snapshots completed requests before a single-service workflow item is updated', async () => {
    prismaMock.serviceWorkflow.findUnique.mockResolvedValue({
      id: 501,
      isRequired: true,
      position: 1,
      serviceId: 10,
      stage: {
        color: '#0f766e',
        id: 203,
        isActive: true,
        name: 'Review',
        slug: 'review',
      },
      stageId: 203,
    });
    prismaMock.serviceWorkflow.findMany.mockResolvedValue([
      {
        id: 501,
        isRequired: true,
        position: 1,
        serviceId: 10,
        stageId: 203,
      },
    ]);
    prismaMock.userService.findMany.mockResolvedValue([
      {
        currentServiceWorkflowId: 501,
        id: 91,
        status: 'completed',
      },
    ]);
    prismaMock.serviceWorkflow.create.mockResolvedValue({ id: 901 });
    prismaMock.serviceWorkflow.update.mockResolvedValue({
      id: 501,
      isRequired: false,
      position: 1,
      serviceId: 10,
      stage: {
        color: '#0f766e',
        id: 203,
        isActive: true,
        name: 'Review',
        slug: 'review',
      },
      stageId: 203,
    });

    const result = await service.updateWorkflow(501, { isRequired: false }, 99);

    expect(prismaMock.serviceWorkflow.create).toHaveBeenCalledWith({
      data: {
        isRequired: true,
        position: 1001,
        serviceId: 10,
        stageId: 203,
      },
      select: {
        id: true,
      },
    });
    expect(prismaMock.userService.update).toHaveBeenCalledWith({
      where: { id: 91 },
      data: {
        currentServiceWorkflowId: 901,
      },
    });
    expect(prismaMock.serviceWorkflow.update).toHaveBeenCalledWith({
      where: { id: 501 },
      data: {
        isRequired: false,
      },
      include: { stage: true },
    });
    expect(result).toMatchObject({
      id: 501,
      is_required: false,
      service_id: 10,
    });
  });

  it('skips overwriting workflows for services that have their own custom workflows', async () => {
    prismaMock.defaultServiceWorkflow.findMany.mockResolvedValue([
      {
        isRequired: true,
        position: 1,
        stage: { id: 201, slug: 'start' },
        stageId: 201,
      },
      {
        isRequired: true,
        position: 2,
        stage: { id: 202, slug: 'review' },
        stageId: 202,
      },
    ]);
    prismaMock.service.findMany.mockResolvedValue([{ id: 10 }]);
    prismaMock.serviceWorkflow.findMany
      .mockResolvedValueOnce([{ id: 501, serviceId: 10 }])
      .mockResolvedValueOnce([
        { id: 501, serviceId: 10, stageId: 203, position: 1 },
      ]);
    prismaMock.userService.findMany.mockResolvedValue([]);

    const result = await service.applyDefaultWorkflow(
      {
        overwrite: true,
        serviceIds: [10],
      },
      99,
    );

    expect(prismaMock.serviceWorkflow.update).not.toHaveBeenCalled();
    expect(prismaMock.serviceWorkflow.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      applied_service_count: 0,
      applied_service_ids: [],
      blocked_service_ids: [],
      skipped_service_count: 1,
      skipped_service_ids: [10],
    });
  });

  it('initializes the first active workflow for paid requests', async () => {
    prismaMock.userService.findMany.mockResolvedValue([
      { id: 91, serviceId: 10 },
      { id: 92, serviceId: 11 },
    ]);
    prismaMock.serviceWorkflow.findMany.mockResolvedValue([
      { id: 1001, serviceId: 10 },
      { id: 1002, serviceId: 10 },
      { id: 1003, serviceId: 11 },
    ]);
    prismaMock.userService.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.ensureInitialWorkflowForRequests([91, 92]);

    expect(prismaMock.userService.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        currentServiceWorkflowId: null,
        id: 91,
      },
      data: expect.objectContaining({
        currentServiceWorkflowId: 1001,
      }),
    });
    expect(prismaMock.userService.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        currentServiceWorkflowId: null,
        id: 92,
      },
      data: expect.objectContaining({
        currentServiceWorkflowId: 1003,
      }),
    });
    expect(result).toBe(2);
  });
});
