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
exports.ProfileController = void 0;
const common_1 = require("@nestjs/common");
const api_response_1 = require("../../../../shared/http/api-response");
const profile_service_1 = require("../../application/profile.service");
const jwt_auth_guard_1 = require("../../infrastructure/auth/jwt-auth.guard");
const current_auth_user_decorator_1 = require("./current-auth-user.decorator");
const change_password_dto_1 = require("./dto/change-password.dto");
const connect_rm_dto_1 = require("./dto/connect-rm.dto");
const search_rm_dto_1 = require("./dto/search-rm.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
let ProfileController = class ProfileController {
    profileService;
    constructor(profileService) {
        this.profileService = profileService;
    }
    async searchRegionalManagerPublic(query) {
        const result = await this.profileService.searchRegionalManager(query.rm_unique_id);
        return (0, api_response_1.successResponse)(result, 'Regional Manager found');
    }
    async searchRegionalManagerPrivate(query) {
        const result = await this.profileService.searchRegionalManager(query.rm_unique_id);
        return (0, api_response_1.successResponse)(result, 'Regional Manager found');
    }
    async connectRegionalManager(authUser, body) {
        const result = await this.profileService.connectRegionalManager(authUser.userId, body.rm_unique_id);
        return (0, api_response_1.successResponse)(result, 'Connected to Regional Manager successfully');
    }
    async updateProfile(authUser, body) {
        const result = await this.profileService.updateProfile(authUser.userId, body);
        return (0, api_response_1.successResponse)(result, 'Profile updated successfully');
    }
    async changePassword(authUser, body) {
        await this.profileService.changePassword(authUser.userId, body);
        return (0, api_response_1.successResponse)(null, 'Password changed successfully');
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Get)('public/search-rm'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_rm_dto_1.SearchRmDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "searchRegionalManagerPublic", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('user/search-rm'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_rm_dto_1.SearchRmDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "searchRegionalManagerPrivate", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('user/connect-rm'),
    __param(0, (0, current_auth_user_decorator_1.CurrentAuthUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, connect_rm_dto_1.ConnectRmDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "connectRegionalManager", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)('user/profile'),
    __param(0, (0, current_auth_user_decorator_1.CurrentAuthUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('user/change-password'),
    __param(0, (0, current_auth_user_decorator_1.CurrentAuthUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "changePassword", null);
exports.ProfileController = ProfileController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [profile_service_1.ProfileService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map