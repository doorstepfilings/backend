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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const api_response_1 = require("../../../../shared/http/api-response");
const jwt_auth_guard_1 = require("../../../identity/infrastructure/auth/jwt-auth.guard");
const roles_decorator_1 = require("../../../identity/infrastructure/auth/roles.decorator");
const roles_guard_1 = require("../../../identity/infrastructure/auth/roles.guard");
const admin_service_1 = require("../../application/admin.service");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getStats() {
        const stats = await this.adminService.getStats();
        return (0, api_response_1.successResponse)(stats);
    }
    async getActivity() {
        const activity = await this.adminService.getActivity();
        return (0, api_response_1.successResponse)(activity);
    }
    async getUsers(role) {
        const users = await this.adminService.getUsers(role);
        return (0, api_response_1.successResponse)(users);
    }
    async getRMs() {
        const rms = await this.adminService.getRMs();
        return (0, api_response_1.successResponse)(rms);
    }
    async getAccountants() {
        const accountants = await this.adminService.getAccountants();
        return (0, api_response_1.successResponse)(accountants);
    }
    async storeUser(data) {
        const user = await this.adminService.storeUser(data);
        return (0, api_response_1.successResponse)(user, 'User created successfully');
    }
    async deleteUser(id) {
        await this.adminService.deleteUser(id);
        return (0, api_response_1.successResponse)(null, 'User deleted successfully');
    }
    async assignRM(data) {
        const user = await this.adminService.assignRM(data.user_id, data.rm_id);
        return (0, api_response_1.successResponse)(user, 'RM assigned successfully');
    }
    async assignAccountant(data) {
        const user = await this.adminService.assignAccountant(data.user_id, data.accountant_id);
        return (0, api_response_1.successResponse)(user, 'Accountant assigned successfully');
    }
    async updateRole(id, role) {
        const user = await this.adminService.updateRole(id, role);
        return (0, api_response_1.successResponse)(user, 'Role updated successfully');
    }
    async getCategories() {
        const categories = await this.adminService.getCategories();
        return (0, api_response_1.successResponse)(categories);
    }
    async storeCategory(data) {
        const result = await this.adminService.storeCategory(data);
        return (0, api_response_1.successResponse)(result, 'Category created successfully');
    }
    async updateCategory(id, data) {
        const result = await this.adminService.updateCategory(id, data);
        return (0, api_response_1.successResponse)(result, 'Category updated successfully');
    }
    async deleteCategory(id) {
        await this.adminService.deleteCategory(id);
        return (0, api_response_1.successResponse)(null, 'Category deleted successfully');
    }
    async getServices() {
        const services = await this.adminService.getServices();
        return (0, api_response_1.successResponse)(services);
    }
    async getService(id) {
        const service = await this.adminService.getService(id);
        return (0, api_response_1.successResponse)(service);
    }
    async storeService(data) {
        const result = await this.adminService.storeService(data);
        return (0, api_response_1.successResponse)(result, 'Service created successfully');
    }
    async updateService(id, data) {
        const result = await this.adminService.updateService(id, data);
        return (0, api_response_1.successResponse)(result, 'Service updated successfully');
    }
    async deleteService(id) {
        await this.adminService.deleteService(id);
        return (0, api_response_1.successResponse)(null, 'Service deleted successfully');
    }
    async getEnquiries() {
        const enquiries = await this.adminService.getEnquiries();
        return (0, api_response_1.successResponse)(enquiries);
    }
    async updateEnquiryStatus(id, status) {
        const enquiry = await this.adminService.updateEnquiryStatus(id, status);
        return (0, api_response_1.successResponse)(enquiry, 'Enquiry status updated successfully');
    }
    async deleteEnquiry(id) {
        await this.adminService.deleteEnquiry(id);
        return (0, api_response_1.successResponse)(null, 'Enquiry deleted successfully');
    }
    async getServiceApplications(status) {
        const result = await this.adminService.getAllServiceApplications(status);
        return (0, api_response_1.successResponse)(result);
    }
    async getServiceApplication(id) {
        const result = await this.adminService.getServiceApplication(id);
        return (0, api_response_1.successResponse)(result);
    }
    async updateApplicationStatus(id, data) {
        const result = await this.adminService.updateApplicationStatus(id, data);
        return (0, api_response_1.successResponse)(result);
    }
    async assignAccountantToService(id, accountantId) {
        const result = await this.adminService.assignAccountantToService(id, accountantId);
        return (0, api_response_1.successResponse)(result);
    }
    async updateDocumentStatus(id, docId, data) {
        const result = await this.adminService.updateDocumentStatus(id, docId, data.status, data.remark);
        return (0, api_response_1.successResponse)(result, `Document ${data.status} successfully`);
    }
    async uploadCertificate(id, file) {
        if (!file)
            throw new common_1.BadRequestException('File is required');
        const result = await this.adminService.updateApplicationStatus(id, {
            status: 'approved',
            certificate_url: `certificates/${id}/${file.originalname}`,
        });
        return (0, api_response_1.successResponse)(result);
    }
    async getRegionalManagerDetails(id) {
        const result = await this.adminService.getRegionalManagerDetails(id);
        return (0, api_response_1.successResponse)(result);
    }
    async getAccountantDetails(id) {
        const result = await this.adminService.getAccountantDetails(id);
        return (0, api_response_1.successResponse)(result);
    }
    async getUserDetails(id) {
        const result = await this.adminService.getUserDetails(id);
        return (0, api_response_1.successResponse)(result);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('activity'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getActivity", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('rms'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRMs", null);
__decorate([
    (0, common_1.Get)('accountants'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAccountants", null);
__decorate([
    (0, common_1.Post)('users/store'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "storeUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('users/assign-rm'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignRM", null);
__decorate([
    (0, common_1.Post)('users/assign-accountant'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignAccountant", null);
__decorate([
    (0, common_1.Post)('users/update-role/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Post)('categories/store'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "storeCategory", null);
__decorate([
    (0, common_1.Patch)('categories/update/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Get)('services'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getServices", null);
__decorate([
    (0, common_1.Get)('services/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getService", null);
__decorate([
    (0, common_1.Post)('services/store'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "storeService", null);
__decorate([
    (0, common_1.Patch)('services/update/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateService", null);
__decorate([
    (0, common_1.Delete)('services/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteService", null);
__decorate([
    (0, common_1.Get)('enquiries'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getEnquiries", null);
__decorate([
    (0, common_1.Post)('enquiries/update-status/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateEnquiryStatus", null);
__decorate([
    (0, common_1.Delete)('enquiries/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteEnquiry", null);
__decorate([
    (0, common_1.Get)('service-applications'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getServiceApplications", null);
__decorate([
    (0, common_1.Get)('service-applications/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getServiceApplication", null);
__decorate([
    (0, common_1.Post)('service-applications/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateApplicationStatus", null);
__decorate([
    (0, common_1.Post)('service-applications/:id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('accountant_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignAccountantToService", null);
__decorate([
    (0, common_1.Patch)('service-applications/:id/documents/:docId/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('docId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateDocumentStatus", null);
__decorate([
    (0, common_1.Post)('service-applications/:id/upload-certificate'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('certificate')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "uploadCertificate", null);
__decorate([
    (0, common_1.Get)('regional-managers/:id/details'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRegionalManagerDetails", null);
__decorate([
    (0, common_1.Get)('accountants/:id/details'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAccountantDetails", null);
__decorate([
    (0, common_1.Get)('users/:id/details'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserDetails", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map