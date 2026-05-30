import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { CurrentAuthUser } from '../../../identity/presentation/http/current-auth-user.decorator';
import { ChatService } from '../../application/chat.service';
import { successResponse } from '../../../../shared/http/api-response';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('threads')
  async getThreads(
    @CurrentAuthUser() authUser: { userId: number; role: string },
  ) {
    return successResponse(await this.chatService.getThreads(authUser));
  }

  @Get('thread/:userServiceId')
  async getThread(
    @CurrentAuthUser() authUser: { userId: number; role: string },
    @Param('userServiceId', ParseIntPipe) userServiceId: number,
  ) {
    return successResponse(
      await this.chatService.getThreadByUserServiceId(authUser, userServiceId),
    );
  }

  @Get('messages/:threadId')
  async getMessages(
    @CurrentAuthUser() authUser: { userId: number; role: string },
    @Param('threadId', ParseIntPipe) threadId: number,
  ) {
    return successResponse(
      await this.chatService.getMessages(authUser, threadId),
    );
  }

  @Post('messages/:threadId')
  async postMessage(
    @CurrentAuthUser() authUser: { userId: number; role: string },
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body() body: SendMessageDto,
  ) {
    return successResponse(
      await this.chatService.sendMessage(authUser, threadId, body.message),
      'Message sent successfully',
    );
  }

  @Patch('messages/:threadId/read')
  async markAsRead(
    @CurrentAuthUser() authUser: { userId: number; role: string },
    @Param('threadId', ParseIntPipe) threadId: number,
  ) {
    return successResponse(
      await this.chatService.markAsRead(authUser, threadId),
      'Messages marked as read',
    );
  }

  @Get('unread-count')
  async getUnreadCount(
    @CurrentAuthUser() authUser: { userId: number; role: string },
  ) {
    return successResponse(await this.chatService.getUnreadCount(authUser));
  }
}
