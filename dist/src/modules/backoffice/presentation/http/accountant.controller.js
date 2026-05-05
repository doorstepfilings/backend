"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountantController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../../../identity/infrastructure/auth/jwt-auth.guard");
const roles_decorator_1 = require("../../../identity/infrastructure/auth/roles.decorator");
const roles_guard_1 = require("../../../identity/infrastructure/auth/roles.guard");
const accountant_service_1 = require("../../application/accountant.service");
const api_response_1 = require("../../../../shared/http/api-response");
const apply_service_request_parser_1 = require("../../../operations/presentation/http/apply-service-request.parser");
let AccountantController = class AccountantController {
    accountantService;
    constructor(accountantService) {
        this.accountantService = accountantService;
    }
    async getAssignedUsers(req) {
        const result = await this.accountantService.getAssignedUsers(req.user.id);
        return (0, api_response_1.successResponse)(result);
    }
    async listRequests(req, status) {
        const result = await this.accountantService.listRequests(req.user.id, status);
        return (0, api_response_1.successResponse)(result);
    }
    async showRequest(req, id) {
        const result = await this.accountantService.showRequest(req.user.id, id);
        return (0, api_response_1.successResponse)(result);
    }
    async updateStatus(req, id, body) {
        const result = await this.accountantService.updateStatus(req.user.id, id, body);
        return (0, api_response_1.successResponse)(result, 'Status updated successfully');
    }
    async listDocuments(req, id) {
        const result = await this.accountantService.listDocuments(req.user.id, id);
        return (0, api_response_1.successResponse)(result);
    }
    async uploadDocuments(req, id, body, files = []) {
        const normalizedFiles = (0, apply_service_request_parser_1.normalizeUploadedDocumentFiles)(files);
        const uploadedFiles = (0, apply_service_request_parser_1.mergeUploadedFilesWithMetadata)(normalizedFiles, (0, apply_service_request_parser_1.parseApplyServiceDocumentMetadata)(body));
        const result = await this.accountantService.uploadDocuments(req.user.id, id, uploadedFiles);
        return (0, api_response_1.successResponse)(result, 'Documents uploaded successfully');
    }
    async deleteDocument(req, docId) {
        await this.accountantService.deleteDocument(req.user.id, docId);
        return (0, api_response_1.successResponse)(null, 'Document deleted successfully');
    }
    async deleteRequestDocument(req, id, docId) {
        await this.accountantService.deleteDocumentFromRequest(req.user.id, id, docId);
        return (0, api_response_1.successResponse)(null, 'Document deleted successfully');
    }
    async verifyDocument(req, id, data) {
        const result = await this.accountantService.verifyDocument(req.user.id, id, data.doc_id, data.status, data.notes);
        return (0, api_response_1.successResponse)(result, `Document ${data.status} successfully`);
    }
    async verifyDocumentByPath(req, id, docId, data) {
        const result = await this.accountantService.verifyDocument(req.user.id, id, docId, data.status, data.notes);
        return (0, api_response_1.successResponse)(result, `Document ${data.status} successfully`);
    }
    async updateDocumentStatus(req, id, docId, data) {
        const result = await this.accountantService.verifyDocument(req.user.id, id, docId, data.status, data.notes);
        return (0, api_response_1.successResponse)(result, `Document ${data.status} successfully`);
    }
    async submitRevision(req, id, data) {
        const result = await this.accountantService.submitRevision(req.user.id, id, data.notes ?? '');
        return (0, api_response_1.successResponse)(result, 'Revision submitted successfully');
    }
};
exports.AccountantController = AccountantController;
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.Get)('assigned-users'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getAssignedUsers", null);
__decorate([
    (0, common_1.Get)('service-requests'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "listRequests", null);
__decorate([
    (0, common_1.Get)('service-requests/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "showRequest", null);
__decorate([
    (0, common_1.Patch)('service-requests/:id/status'),
    (0, common_1.Post)('service-requests/:id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('service-requests/:id/documents'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "listDocuments", null);
__decorate([
    (0, common_1.Post)('service-requests/:id/documents'),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)()),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object, Array]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "uploadDocuments", null);
__decorate([
    (0, common_1.Delete)('documents/:docId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('docId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Delete)('service-requests/:id/documents/:docId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('docId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "deleteRequestDocument", null);
__decorate([
    (0, common_1.Post)('service-requests/:id/verify-document'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "verifyDocument", null);
__decorate([
    (0, common_1.Patch)('service-requests/:id/documents/:docId/verify'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('docId', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "verifyDocumentByPath", null);
__decorate([
    (0, common_1.Patch)('service-requests/:id/documents/:docId/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('docId', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "updateDocumentStatus", null);
__decorate([
    (0, common_1.Post)('service-requests/:id/revision'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "submitRevision", null);
exports.AccountantController = AccountantController = __decorate([
    (0, common_1.Controller)('accountant'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('accountant'),
    __metadata("design:paramtypes", [accountant_service_1.AccountantService])
], AccountantController);
//# sourceMappingURL=accountant.controller.js.map