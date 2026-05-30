import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { successResponse } from '../../../../shared/http/api-response';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { CurrentAuthUser } from '../../../identity/presentation/http/current-auth-user.decorator';
import type { UploadedDocumentFile } from '../../application/document-upload.service';
import { UserServicesService } from '../../application/user-services.service';
import {
  mergeUploadedFilesWithMetadata,
  normalizeUploadedDocumentFiles,
  parseApplyServiceDocumentMetadata,
  parseApplyServiceDto,
} from './apply-service-request.parser';

@Controller('service')
export class UserServicesController {
  constructor(private readonly userServicesService: UserServicesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-services')
  async getMyServices(@CurrentAuthUser() authUser: { userId: number }) {
    const services = await this.userServicesService.getMyServices(
      authUser.userId,
    );

    return successResponse(services);
  }

  @UseGuards(JwtAuthGuard)
  @Post('apply')
  @UseInterceptors(AnyFilesInterceptor())
  async applyForService(
    @CurrentAuthUser() authUser: { userId: number },
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: UploadedDocumentFile[] = [],
  ) {
    const dto = parseApplyServiceDto(body);
    const normalizedFiles = normalizeUploadedDocumentFiles(files);
    const uploadedFiles = mergeUploadedFilesWithMetadata(
      normalizedFiles,
      parseApplyServiceDocumentMetadata(body),
    );
    const result = await this.userServicesService.applyForService(
      authUser.userId,
      dto,
      uploadedFiles,
    );

    return successResponse(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('my-services/:id/documents')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadMyDocuments(
    @CurrentAuthUser() authUser: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: UploadedDocumentFile[] = [],
  ) {
    const normalizedFiles = normalizeUploadedDocumentFiles(files);
    const uploadedFiles = mergeUploadedFilesWithMetadata(
      normalizedFiles,
      parseApplyServiceDocumentMetadata(body),
    );
    const result = await this.userServicesService.uploadMyDocuments(
      authUser.userId,
      id,
      uploadedFiles,
    );

    return successResponse(result, 'Documents uploaded successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Delete('my-services/:id')
  async deleteMyService(
    @CurrentAuthUser() authUser: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.userServicesService.deleteMyService(authUser.userId, id);

    return successResponse(null, 'Service removed successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Delete('my-services/:id/documents/:docId')
  async deleteMyDocument(
    @CurrentAuthUser() authUser: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
  ) {
    await this.userServicesService.deleteMyDocument(authUser.userId, id, docId);

    return successResponse(null, 'Document deleted successfully');
  }
}
