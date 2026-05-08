import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { Roles } from '../../../identity/infrastructure/auth/roles.decorator';
import { RolesGuard } from '../../../identity/infrastructure/auth/roles.guard';
import { AccountantService } from '../../application/accountant.service';
import { successResponse } from '../../../../shared/http/api-response';
import type { UploadedDocumentFile } from '../../../operations/application/document-upload.service';
import {
    mergeUploadedFilesWithMetadata,
    normalizeUploadedDocumentFiles,
    parseApplyServiceDocumentMetadata,
} from '../../../operations/presentation/http/apply-service-request.parser';

@Controller('accountant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('accountant')
export class AccountantController {
    constructor(private readonly accountantService: AccountantService) {}

    @Get('users')
    @Get('assigned-users')
    async getAssignedUsers(@Req() req: any) {
        const result = await this.accountantService.getAssignedUsers(req.user.id);
        return successResponse(result);
    }

    @Get('users/:id')
    async getUserDetail(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        const result = await this.accountantService.getUserById(req.user.id, id);
        return successResponse(result);
    }

    @Get('service-requests')
    async listRequests(@Req() req: any, @Query('status') status?: string) {
        const result = await this.accountantService.listRequests(req.user.id, status);
        return successResponse(result);
    }

    @Get('service-requests/:id')
    async showRequest(@Req() req: any, @Param('id') id: number) {
        const result = await this.accountantService.showRequest(req.user.id, id);
        return successResponse(result);
    }

    @Patch('service-requests/:id/status')
    @Post('service-requests/:id/status')
    async updateStatus(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { status: string; ca_notes?: string; update_note?: string; rejection_reason?: string }) {
        const result = await this.accountantService.updateStatus(req.user.id, id, body);
        return successResponse(result, 'Status updated successfully');
    }

    @Get('service-requests/:id/documents')
    async listDocuments(@Req() req: any, @Param('id') id: number) {
        const result = await this.accountantService.listDocuments(req.user.id, id);
        return successResponse(result);
    }

    @Post('service-requests/:id/documents')
    @UseInterceptors(AnyFilesInterceptor())
    async uploadDocuments(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: Record<string, unknown>,
        @UploadedFiles() files: UploadedDocumentFile[] = [],
    ) {
        const isFinalGlobal =
            body['is_final'] === '1' ||
            body['is_final'] === 'true' ||
            body['is_final'] === true;
        const metadata = parseApplyServiceDocumentMetadata(body);
        const normalizedFiles = normalizeUploadedDocumentFiles(files);

        console.log('[AccountantController] Upload started', {
            requestId: id,
            isFinalGlobal,
            filesCount: files.length,
            metadata: JSON.stringify(metadata)
        });

        const uploadedFiles = mergeUploadedFilesWithMetadata(
            normalizedFiles,
            metadata,
        ).map(file => ({
            ...file,
            isFinal: file.isFinal ?? isFinalGlobal,
        }));

        console.log('[AccountantController] Merged files', {
            mergedCount: uploadedFiles.length,
            types: uploadedFiles.map(f => f.documentType),
            finals: uploadedFiles.map(f => f.isFinal)
        });

        const result = await this.accountantService.uploadDocuments(
            req.user.id,
            id,
            uploadedFiles,
        );
        return successResponse(result, 'Artifacts successfully archived');
    }


    @Delete('documents/:docId')
    async deleteDocument(@Req() req: any, @Param('docId') docId: number) {
        await this.accountantService.deleteDocument(req.user.id, docId);
        return successResponse(null, 'Document deleted successfully');
    }

    @Delete('service-requests/:id/documents/:docId')
    async deleteRequestDocument(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Param('docId', ParseIntPipe) docId: number,
    ) {
        await this.accountantService.deleteDocumentFromRequest(
            req.user.id,
            id,
            docId,
        );
        return successResponse(null, 'Document deleted successfully');
    }

    @Post('service-requests/:id/verify-document')
    async verifyDocument(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { doc_id: number; status: 'verified' | 'rejected'; notes?: string },
    ) {
        const result = await this.accountantService.verifyDocument(req.user.id, id, data.doc_id, data.status, data.notes);
        return successResponse(result, `Document ${data.status} successfully`);
    }

    @Patch('service-requests/:id/documents/:docId/verify')
    async verifyDocumentByPath(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Param('docId', ParseIntPipe) docId: number,
        @Body() data: { status: 'verified' | 'rejected'; notes?: string },
    ) {
        const result = await this.accountantService.verifyDocument(req.user.id, id, docId, data.status, data.notes);
        return successResponse(result, `Document ${data.status} successfully`);
    }

    @Patch('service-requests/:id/documents/:docId/status')
    async updateDocumentStatus(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Param('docId', ParseIntPipe) docId: number,
        @Body() data: { status: 'verified' | 'rejected'; notes?: string },
    ) {
        const result = await this.accountantService.verifyDocument(req.user.id, id, docId, data.status, data.notes);
        return successResponse(result, `Document ${data.status} successfully`);
    }

    @Post('service-requests/:id/revision')
    async submitRevision(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { notes?: string },
    ) {
        const result = await this.accountantService.submitRevision(
            req.user.id,
            id,
            data.notes ?? '',
        );
        return successResponse(result, 'Revision submitted successfully');
    }
}
