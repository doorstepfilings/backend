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
exports.UserServicesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const api_response_1 = require("../../../../shared/http/api-response");
const jwt_auth_guard_1 = require("../../../identity/infrastructure/auth/jwt-auth.guard");
const current_auth_user_decorator_1 = require("../../../identity/presentation/http/current-auth-user.decorator");
const user_services_service_1 = require("../../application/user-services.service");
const apply_service_request_parser_1 = require("./apply-service-request.parser");
let UserServicesController = class UserServicesController {
    userServicesService;
    constructor(userServicesService) {
        this.userServicesService = userServicesService;
    }
    async getMyServices(authUser) {
        const services = await this.userServicesService.getMyServices(authUser.userId);
        return (0, api_response_1.successResponse)(services);
    }
    async applyForService(authUser, body, files = []) {
        const dto = (0, apply_service_request_parser_1.parseApplyServiceDto)(body);
        const normalizedFiles = (0, apply_service_request_parser_1.normalizeUploadedDocumentFiles)(files);
        const uploadedFiles = (0, apply_service_request_parser_1.mergeUploadedFilesWithMetadata)(normalizedFiles, (0, apply_service_request_parser_1.parseApplyServiceDocumentMetadata)(body));
        const result = await this.userServicesService.applyForService(authUser.userId, dto, uploadedFiles);
        return (0, api_response_1.successResponse)(result);
    }
    async uploadMyDocuments(authUser, id, body, files = []) {
        const normalizedFiles = (0, apply_service_request_parser_1.normalizeUploadedDocumentFiles)(files);
        const uploadedFiles = (0, apply_service_request_parser_1.mergeUploadedFilesWithMetadata)(normalizedFiles, (0, apply_service_request_parser_1.parseApplyServiceDocumentMetadata)(body));
        const result = await this.userServicesService.uploadMyDocuments(authUser.userId, id, uploadedFiles);
        return (0, api_response_1.successResponse)(result, 'Documents uploaded successfully');
    }
    async deleteMyService(authUser, id) {
        await this.userServicesService.deleteMyService(authUser.userId, id);
        return (0, api_response_1.successResponse)(null, 'Service removed successfully');
    }
    async deleteMyDocument(authUser, id, docId) {
        await this.userServicesService.deleteMyDocument(authUser.userId, id, docId);
        return (0, api_response_1.successResponse)(null, 'Document deleted successfully');
    }
};
exports.UserServicesController = UserServicesController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('my-services'),
    __param(0, (0, current_auth_user_decorator_1.CurrentAuthUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserServicesController.prototype, "getMyServices", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('apply'),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)()),
    __param(0, (0, current_auth_user_decorator_1.CurrentAuthUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Array]),
    __metadata("design:returntype", Promise)
], UserServicesController.prototype, "applyForService", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('my-services/:id/documents'),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)()),
    __param(0, (0, current_auth_user_decorator_1.CurrentAuthUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object, Array]),
    __metadata("design:returntype", Promise)
], UserServicesController.prototype, "uploadMyDocuments", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('my-services/:id'),
    __param(0, (0, current_auth_user_decorator_1.CurrentAuthUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], UserServicesController.prototype, "deleteMyService", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('my-services/:id/documents/:docId'),
    __param(0, (0, current_auth_user_decorator_1.CurrentAuthUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('docId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], UserServicesController.prototype, "deleteMyDocument", null);
exports.UserServicesController = UserServicesController = __decorate([
    (0, common_1.Controller)('service'),
    __metadata("design:paramtypes", [user_services_service_1.UserServicesService])
], UserServicesController);
//# sourceMappingURL=user-services.controller.js.map