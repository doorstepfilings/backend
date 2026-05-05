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
var RMService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RMService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../identity/infrastructure/persistence/user.entity");
const user_service_entity_1 = require("../../operations/infrastructure/persistence/user-service.entity");
const identity_mapper_1 = require("../../identity/application/identity.mapper");
const operations_mapper_1 = require("../../operations/application/operations.mapper");
const notification_service_1 = require("../../communication/notification.service");
let RMService = class RMService {
    static { RMService_1 = this; }
    usersRepository;
    userServicesRepository;
    notificationService;
    static ACTIVE_SERVICE_TERMINAL_STATUSES = [
        'cancelled',
        'completed',
        'rejected',
    ];
    constructor(usersRepository, userServicesRepository, notificationService) {
        this.usersRepository = usersRepository;
        this.userServicesRepository = userServicesRepository;
        this.notificationService = notificationService;
    }
    async getAssignedUsers(rmId) {
        const users = await this.usersRepository.find({
            where: { rmId, role: 'user' },
            relations: { accountant: true },
            take: 20,
        });
        return users.map(identity_mapper_1.toUserResource);
    }
    async getAccountants() {
        return this.usersRepository.find({
            where: { role: 'accountant' },
            select: ['id', 'name', 'email', 'mobileNumber'],
            order: { name: 'ASC' },
        });
    }
    async assignAccountant(rmId, userId, accountantId) {
        const user = await this.usersRepository.findOne({
            where: { id: userId, rmId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found or not assigned to you');
        }
        if (accountantId) {
            const accountant = await this.usersRepository.findOne({
                where: { id: accountantId, role: 'accountant' },
            });
            if (!accountant) {
                throw new common_1.UnauthorizedException('Invalid accountant');
            }
            user.accountantId = accountantId;
            await this.userServicesRepository.update({
                userId,
                status: (0, typeorm_2.Not)((0, typeorm_2.In)(RMService_1.ACTIVE_SERVICE_TERMINAL_STATUSES)),
            }, { accountantId });
            this.notificationService.sendAccountantAssignmentNotification(accountant, user);
        }
        else {
            user.accountantId = null;
            await this.userServicesRepository.update({
                userId,
                status: (0, typeorm_2.Not)((0, typeorm_2.In)(RMService_1.ACTIVE_SERVICE_TERMINAL_STATUSES)),
            }, { accountantId: null });
        }
        await this.usersRepository.save(user);
        return (0, identity_mapper_1.toUserResource)(user);
    }
    async getAssignedUserServices(rmId) {
        const users = await this.usersRepository.find({
            where: { rmId, role: 'user' },
            select: ['id'],
        });
        const userIds = Array.isArray(users) ? users.map(u => u.id) : [];
        if (userIds.length === 0)
            return [];
        const services = await this.userServicesRepository.find({
            where: { userId: (0, typeorm_2.In)(userIds), status: (0, typeorm_2.Not)('in_cart') },
            relations: {
                service: true,
                user: true,
                accountant: true,
                requestDocuments: { uploadedBy: true },
            },
            order: { createdAt: 'DESC' },
        });
        return services.map((service) => (0, operations_mapper_1.toUserServiceResource)(service));
    }
};
exports.RMService = RMService;
exports.RMService = RMService = RMService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_service_entity_1.UserServiceEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notification_service_1.NotificationService])
], RMService);
//# sourceMappingURL=rm.service.js.map