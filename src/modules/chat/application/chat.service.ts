import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/services/prisma.service';

type AuthActor = {
  userId: number;
  role: string;
};

const CHAT_USER_SELECT = {
  id: true,
  name: true,
  role: true,
  email: true,
} as const;

const CHAT_THREAD_INCLUDE = {
  userService: {
    include: {
      user: { select: CHAT_USER_SELECT },
      accountant: { select: CHAT_USER_SELECT },
      service: { select: { id: true, name: true } },
    },
  },
} as const;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeRole(role: string) {
    return String(role ?? '').toLowerCase();
  }

  private isAdminRole(role: string) {
    return ['admin', 'super_admin'].includes(this.normalizeRole(role));
  }

  private isRmRole(role: string) {
    return ['rm', 'regional_manager'].includes(this.normalizeRole(role));
  }

  private isAccountantRole(role: string) {
    return this.normalizeRole(role) === 'accountant';
  }

  private isUserRole(role: string) {
    return this.normalizeRole(role) === 'user';
  }

  private buildThreadAccessWhere(
    actor: AuthActor,
  ): Prisma.ChatThreadWhereInput {
    const role = this.normalizeRole(actor.role);

    if (this.isAdminRole(role)) {
      return {};
    }

    if (this.isRmRole(role)) {
      return {
        userService: {
          user: {
            rmId: actor.userId,
          },
        },
      };
    }

    if (this.isAccountantRole(role)) {
      return {
        userService: {
          OR: [
            { accountantId: actor.userId },
            { user: { accountantId: actor.userId } },
          ],
        },
      };
    }

    return {
      userService: {
        userId: actor.userId,
      },
    };
  }

  private async getAccessibleUserService(
    actor: AuthActor,
    userServiceId: number,
  ) {
    const userService = await this.prisma.userService.findUnique({
      where: { id: userServiceId },
      include: {
        user: {
          select: {
            id: true,
            rmId: true,
            accountantId: true,
          },
        },
        accountant: {
          select: {
            id: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!userService) {
      throw new NotFoundException('Service request not found');
    }

    const role = this.normalizeRole(actor.role);

    if (this.isAdminRole(role)) {
      return userService;
    }

    if (this.isRmRole(role) && userService.user.rmId === actor.userId) {
      return userService;
    }

    if (this.isUserRole(role) && userService.userId === actor.userId) {
      return userService;
    }

    if (
      this.isAccountantRole(role) &&
      (userService.accountantId === actor.userId ||
        userService.user.accountantId === actor.userId)
    ) {
      return userService;
    }

    throw new ForbiddenException(
      'You do not have permission to access this chat',
    );
  }

  private async getAccessibleThread(actor: AuthActor, threadId: number) {
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      include: {
        userService: {
          include: {
            user: {
              select: {
                id: true,
                rmId: true,
                accountantId: true,
              },
            },
            accountant: {
              select: {
                id: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Chat thread not found');
    }

    await this.getAccessibleUserService(actor, thread.userServiceId);
    return thread;
  }

  private validateMessage(message: string) {
    const trimmedMessage = String(message ?? '').trim();

    if (!trimmedMessage) {
      throw new BadRequestException('Message content cannot be empty');
    }

    if (trimmedMessage.length > 5000) {
      throw new BadRequestException('Message is too long');
    }

    return trimmedMessage;
  }

  private async ensureParticipant(
    threadId: number,
    userId: number,
    lastReadAt?: Date | null,
  ) {
    return this.prisma.chatThreadParticipant.upsert({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
      update: {
        ...(lastReadAt ? { lastReadAt } : {}),
      },
      create: {
        threadId,
        userId,
        ...(lastReadAt ? { lastReadAt } : {}),
      },
    });
  }

  private async ensureParticipants(threadIds: number[], userId: number) {
    if (threadIds.length === 0) {
      return [];
    }

    await this.prisma.chatThreadParticipant.createMany({
      data: threadIds.map((threadId) => ({
        threadId,
        userId,
      })),
      skipDuplicates: true,
    });

    return this.prisma.chatThreadParticipant.findMany({
      where: {
        userId,
        threadId: { in: threadIds },
      },
      select: {
        threadId: true,
        lastReadAt: true,
      },
    });
  }

  private async getUnreadCountMap(actor: AuthActor, threadIds: number[]) {
    const participants = await this.ensureParticipants(threadIds, actor.userId);
    const unreadScope = participants.map((participant) =>
      participant.lastReadAt
        ? {
            threadId: participant.threadId,
            createdAt: {
              gt: participant.lastReadAt,
            },
          }
        : {
            threadId: participant.threadId,
          },
    );

    if (unreadScope.length === 0) {
      return new Map<number, number>();
    }

    const unreadCounts = await this.prisma.chatMessage.groupBy({
      by: ['threadId'],
      where: {
        senderId: { not: actor.userId },
        OR: unreadScope,
      },
      _count: {
        _all: true,
      },
    });

    return new Map(
      unreadCounts.map((item) => [item.threadId, item._count._all]),
    );
  }

  async findOrCreateThread(actor: AuthActor, userServiceId: number) {
    await this.getAccessibleUserService(actor, userServiceId);

    const thread = await this.prisma.chatThread.upsert({
      where: { userServiceId },
      update: {},
      create: { userServiceId },
      include: CHAT_THREAD_INCLUDE,
    });

    await this.ensureParticipant(thread.id, actor.userId);
    return thread;
  }

  async getThreads(actor: AuthActor) {
    const threads = await this.prisma.chatThread.findMany({
      where: this.buildThreadAccessWhere(actor),
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      include: {
        ...CHAT_THREAD_INCLUDE,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: CHAT_USER_SELECT },
          },
        },
      },
    });

    const unreadMap = await this.getUnreadCountMap(
      actor,
      threads.map((thread) => thread.id),
    );

    return threads.map((thread) => ({
      ...thread,
      unreadCount: unreadMap.get(thread.id) ?? 0,
      latestMessagePreview:
        thread.lastMessage ?? thread.messages[0]?.message ?? null,
    }));
  }

  async getThreadByUserServiceId(actor: AuthActor, userServiceId: number) {
    const thread = await this.findOrCreateThread(actor, userServiceId);
    const unreadMap = await this.getUnreadCountMap(actor, [thread.id]);

    return {
      ...thread,
      unreadCount: unreadMap.get(thread.id) ?? 0,
      latestMessagePreview: thread.lastMessage,
    };
  }

  async getMessages(actor: AuthActor, threadId: number) {
    await this.getAccessibleThread(actor, threadId);
    await this.ensureParticipant(threadId, actor.userId);

    return this.prisma.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: CHAT_USER_SELECT },
      },
    });
  }

  async sendMessage(actor: AuthActor, threadId: number, message: string) {
    await this.getAccessibleThread(actor, threadId);
    const trimmedMessage = this.validateMessage(message);

    const createdMessage = await this.prisma.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: {
          threadId,
          senderId: actor.userId,
          message: trimmedMessage,
          type: 'text',
        },
        include: {
          sender: { select: CHAT_USER_SELECT },
        },
      });

      await tx.chatThread.update({
        where: { id: threadId },
        data: {
          lastMessage: trimmedMessage,
          lastMessageAt: created.createdAt,
          status: 'open',
        },
      });

      await tx.chatThreadParticipant.upsert({
        where: {
          threadId_userId: {
            threadId,
            userId: actor.userId,
          },
        },
        update: {
          lastReadAt: created.createdAt,
        },
        create: {
          threadId,
          userId: actor.userId,
          lastReadAt: created.createdAt,
        },
      });

      return created;
    });

    return createdMessage;
  }

  async sendMessageByUserServiceId(
    actor: AuthActor,
    userServiceId: number,
    message: string,
  ) {
    const thread = await this.findOrCreateThread(actor, userServiceId);
    return this.sendMessage(actor, thread.id, message);
  }

  async markAsRead(actor: AuthActor, threadId: number) {
    const thread = await this.getAccessibleThread(actor, threadId);
    const latestMessage = await this.prisma.chatMessage.findFirst({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
      },
    });

    const lastReadAt = latestMessage?.createdAt ?? new Date();
    const acknowledgedAt = new Date();

    const [, updateResult] = await this.prisma.$transaction([
      this.prisma.chatThreadParticipant.upsert({
        where: {
          threadId_userId: {
            threadId,
            userId: actor.userId,
          },
        },
        update: {
          lastReadAt,
        },
        create: {
          threadId,
          userId: actor.userId,
          lastReadAt,
        },
      }),
      this.prisma.chatMessage.updateMany({
        where: {
          threadId,
          senderId: { not: actor.userId },
          isRead: false,
          createdAt: { lte: lastReadAt },
        },
        data: {
          isRead: true,
          readAt: acknowledgedAt,
          readById: actor.userId,
        },
      }),
    ]);

    return {
      threadId,
      userServiceId: thread.userServiceId,
      userId: actor.userId,
      updatedCount: updateResult.count,
    };
  }

  async getUnreadCount(actor: AuthActor) {
    const threads = await this.prisma.chatThread.findMany({
      where: this.buildThreadAccessWhere(actor),
      select: {
        id: true,
      },
    });

    const unreadMap = await this.getUnreadCountMap(
      actor,
      threads.map((thread) => thread.id),
    );

    const unreadCount = Array.from(unreadMap.values()).reduce(
      (total, count) => total + count,
      0,
    );

    return { unreadCount };
  }
}
