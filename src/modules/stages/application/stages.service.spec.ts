import { BadRequestException } from '@nestjs/common';
import { StagesService } from './stages.service';

describe('StagesService', () => {
  let prismaMock: any;
  let workflowLogsServiceMock: any;
  let service: StagesService;

  beforeEach(() => {
    prismaMock = {
      stage: {
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      serviceWorkflow: {
        count: jest.fn(),
      },
      defaultServiceWorkflow: {
        count: jest.fn().mockResolvedValue(0),
      },
    };
    workflowLogsServiceMock = {
      record: jest.fn(),
    };

    service = new StagesService(prismaMock, workflowLogsServiceMock);
  });

  it('does not allow updating a default stage', async () => {
    prismaMock.stage.findUnique.mockResolvedValue({
      color: '#0f766e',
      id: 1,
      isActive: true,
      isDefault: true,
      name: 'Start',
      slug: 'start',
    });

    await expect(
      service.updateStage(
        1,
        {
          color: '#123456',
          isActive: false,
          name: 'Kickoff',
        },
        99,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.stage.update).not.toHaveBeenCalled();
    expect(workflowLogsServiceMock.record).not.toHaveBeenCalled();
  });

  it('keeps custom stages editable', async () => {
    prismaMock.stage.findUnique
      .mockResolvedValueOnce({
        color: '#0f766e',
        id: 1,
        isActive: true,
        isDefault: false,
        name: 'Start',
        slug: 'start',
      })
      .mockResolvedValueOnce(null);
    prismaMock.stage.update.mockResolvedValue({
      color: '#123456',
      createdAt: new Date('2026-05-20T09:00:00.000Z'),
      id: 1,
      isActive: false,
      isDefault: false,
      name: 'Kickoff',
      slug: 'kickoff',
      updatedAt: new Date('2026-05-20T09:30:00.000Z'),
    });

    const result = await service.updateStage(
      1,
      {
        color: '#123456',
        isActive: false,
        name: 'Kickoff',
      },
      99,
    );

    expect(prismaMock.stage.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        color: '#123456',
        isActive: false,
        name: 'Kickoff',
        slug: 'kickoff',
      },
    });
    expect(result).toMatchObject({
      id: 1,
      is_active: false,
      is_default: false,
      name: 'Kickoff',
      slug: 'kickoff',
    });
  });

  it('does not allow deleting a default stage', async () => {
    prismaMock.stage.findUnique.mockResolvedValue({
      id: 1,
      isDefault: true,
      name: 'Start',
    });

    await expect(service.deleteStage(1, 99)).rejects.toThrow(
      BadRequestException,
    );
    expect(prismaMock.serviceWorkflow.count).not.toHaveBeenCalled();
    expect(prismaMock.stage.delete).not.toHaveBeenCalled();
    expect(workflowLogsServiceMock.record).not.toHaveBeenCalled();
  });

  it('treats a missing default workflow table as zero usage when deleting a custom stage', async () => {
    prismaMock.stage.findUnique.mockResolvedValue({
      id: 2,
      isDefault: false,
      name: 'Custom Stage',
    });
    prismaMock.serviceWorkflow.count.mockResolvedValue(0);
    prismaMock.defaultServiceWorkflow.count.mockRejectedValue({
      code: 'P2021',
      meta: {
        table: 'default_service_workflows',
      },
    });
    prismaMock.stage.delete.mockResolvedValue({
      id: 2,
    });

    await expect(service.deleteStage(2, 99)).resolves.toBe(true);

    expect(prismaMock.stage.delete).toHaveBeenCalledWith({
      where: { id: 2 },
    });
    expect(workflowLogsServiceMock.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'stage.delete',
        actorId: 99,
        stageId: 2,
      }),
    );
  });
});
