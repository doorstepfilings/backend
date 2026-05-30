import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { ChatService } from './application/chat.service';

type SocketUser = {
  userId: number;
  role: string;
  email?: string;
  name?: string;
};

type AuthenticatedSocket = Socket & {
  user?: SocketUser;
};

@Injectable()
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const origin = client.handshake.headers.origin;
    const allowedOrigin = this.configService.get<string>('app.frontendUrl');

    if (origin && allowedOrigin && origin !== allowedOrigin) {
      client.emit('socketError', { message: 'Socket origin is not allowed' });
      client.disconnect();
      return;
    }

    const token = this.extractToken(client);

    if (!token) {
      client.emit('socketError', { message: 'Authentication token missing' });
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
      });

      client.user = {
        userId: Number(payload.sub ?? payload.userId),
        role: String(payload.role ?? 'user'),
        email: payload.email,
        name: payload.name,
      };
    } catch {
      client.emit('socketError', { message: 'Invalid authentication token' });
      client.disconnect();
    }
  }

  handleDisconnect(_client: AuthenticatedSocket) {}

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { userServiceId: number },
  ) {
    const actor = this.assertSocketUser(client);
    const userServiceId = this.parsePositiveId(
      payload?.userServiceId,
      'userServiceId',
    );

    await this.chatService.findOrCreateThread(actor, userServiceId);
    await client.join(this.getRoomName(userServiceId));

    return { ok: true, room: this.getRoomName(userServiceId) };
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { userServiceId: number; message: string },
  ) {
    const actor = this.assertSocketUser(client);
    const userServiceId = this.parsePositiveId(
      payload?.userServiceId,
      'userServiceId',
    );
    const message = await this.chatService.sendMessageByUserServiceId(
      actor,
      userServiceId,
      String(payload.message ?? ''),
    );

    this.server.to(this.getRoomName(userServiceId)).emit('newMessage', message);

    return message;
  }

  @SubscribeMessage('markAsRead')
  async markAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { threadId: number },
  ) {
    const actor = this.assertSocketUser(client);
    const threadId = this.parsePositiveId(payload?.threadId, 'threadId');
    const result = await this.chatService.markAsRead(actor, threadId);

    this.server
      .to(this.getRoomName(result.userServiceId))
      .emit('messagesRead', result);

    return result;
  }

  @SubscribeMessage('typing')
  async typing(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { userServiceId: number },
  ) {
    const actor = this.assertSocketUser(client);
    const userServiceId = this.parsePositiveId(
      payload?.userServiceId,
      'userServiceId',
    );

    await this.chatService.findOrCreateThread(actor, userServiceId);

    client.to(this.getRoomName(userServiceId)).emit('typing', {
      userServiceId,
      userId: actor.userId,
      role: actor.role,
      name: client.user?.name,
    });

    return { ok: true };
  }

  private getRoomName(userServiceId: number) {
    return `service_${userServiceId}`;
  }

  private assertSocketUser(client: AuthenticatedSocket) {
    if (!client.user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!client.user.userId || !client.user.role) {
      throw new ForbiddenException('Invalid socket session');
    }

    return client.user;
  }

  private extractToken(client: AuthenticatedSocket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return null;
  }

  private parsePositiveId(value: unknown, fieldName: string) {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }

    return parsedValue;
  }
}
