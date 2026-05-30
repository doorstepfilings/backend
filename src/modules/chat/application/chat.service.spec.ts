import { ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let prisma: any;
  let service: ChatService;

  beforeEach(() => {
    prisma = {
      chatMessage: {
        findFirst: jest.fn(),
        groupBy: jest.fn(),
        updateMany: jest.fn(),
      },
      chatThread: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      chatThreadParticipant: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      userService: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (queries: Promise<unknown>[]) =>
        Promise.all(queries),
      ),
    };

    service = new ChatService(prisma);
  });

  it('rejects accountants who are not assigned to the service', async () => {
    prisma.userService.findUnique.mockResolvedValue({
      id: 12,
      userId: 3,
      accountantId: 44,
      user: {
        id: 3,
        accountantId: null,
        rmId: null,
      },
      accountant: {
        id: 44,
      },
      service: {
        id: 7,
        name: 'GST Registration',
      },
    });

    await expect(
      service.findOrCreateThread({ userId: 45, role: 'accountant' }, 12),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.chatThread.upsert).not.toHaveBeenCalled();
  });

  it('calculates unread counts from each actor participant checkpoint', async () => {
    const readAt = new Date('2026-05-28T08:00:00.000Z');

    prisma.chatThread.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    prisma.chatThreadParticipant.createMany.mockResolvedValue({ count: 0 });
    prisma.chatThreadParticipant.findMany.mockResolvedValue([
      { threadId: 1, lastReadAt: readAt },
      { threadId: 2, lastReadAt: null },
    ]);
    prisma.chatMessage.groupBy.mockResolvedValue([
      { threadId: 1, _count: { _all: 2 } },
      { threadId: 2, _count: { _all: 3 } },
    ]);

    await expect(
      service.getUnreadCount({ userId: 9, role: 'user' }),
    ).resolves.toEqual({ unreadCount: 5 });

    expect(prisma.chatMessage.groupBy).toHaveBeenCalledWith({
      by: ['threadId'],
      where: {
        senderId: { not: 9 },
        OR: [
          {
            threadId: 1,
            createdAt: {
              gt: readAt,
            },
          },
          {
            threadId: 2,
          },
        ],
      },
      _count: {
        _all: true,
      },
    });
  });

  it('marks only the current actor checkpoint as read', async () => {
    const latestCreatedAt = new Date('2026-05-28T09:15:00.000Z');

    prisma.chatThread.findUnique.mockResolvedValue({
      id: 4,
      userServiceId: 18,
    });
    prisma.userService.findUnique.mockResolvedValue({
      id: 18,
      userId: 20,
      accountantId: 30,
      user: {
        id: 20,
        accountantId: null,
        rmId: null,
      },
      accountant: {
        id: 30,
      },
      service: {
        id: 7,
        name: 'GST Registration',
      },
    });
    prisma.chatMessage.findFirst.mockResolvedValue({
      createdAt: latestCreatedAt,
    });
    prisma.chatThreadParticipant.upsert.mockResolvedValue({});
    prisma.chatMessage.updateMany.mockResolvedValue({ count: 2 });

    await expect(
      service.markAsRead({ userId: 20, role: 'user' }, 4),
    ).resolves.toMatchObject({
      threadId: 4,
      userId: 20,
      updatedCount: 2,
      userServiceId: 18,
    });

    expect(prisma.chatThreadParticipant.upsert).toHaveBeenCalledWith({
      where: {
        threadId_userId: {
          threadId: 4,
          userId: 20,
        },
      },
      update: {
        lastReadAt: latestCreatedAt,
      },
      create: {
        threadId: 4,
        userId: 20,
        lastReadAt: latestCreatedAt,
      },
    });
    expect(prisma.chatMessage.updateMany).toHaveBeenCalledWith({
      where: {
        threadId: 4,
        senderId: { not: 20 },
        isRead: false,
        createdAt: { lte: latestCreatedAt },
      },
      data: expect.objectContaining({
        isRead: true,
        readById: 20,
      }),
    });
  });
});
