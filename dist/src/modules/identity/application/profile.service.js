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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bcryptjs_1 = require("bcryptjs");
const typeorm_2 = require("typeorm");
const identity_mapper_1 = require("./identity.mapper");
const user_entity_1 = require("../infrastructure/persistence/user.entity");
let ProfileService = class ProfileService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async searchRegionalManager(rmUniqueId) {
        const regionalManager = await this.usersRepository.findOne({
            where: {
                role: 'regional_manager',
                rmUniqueId,
            },
        });
        if (!regionalManager) {
            throw new common_1.NotFoundException('Regional Manager not found');
        }
        return {
            id: regionalManager.id,
            name: regionalManager.name,
            email: regionalManager.email,
            mobile_number: regionalManager.mobileNumber,
            rm_unique_id: regionalManager.rmUniqueId,
        };
    }
    async connectRegionalManager(userId, rmUniqueId) {
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
            relations: {
                accountant: true,
                regionalManager: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.rmId) {
            throw new common_1.BadRequestException('You already have an RM connected');
        }
        const regionalManager = await this.usersRepository.findOne({
            where: {
                role: 'regional_manager',
                rmUniqueId,
            },
        });
        if (!regionalManager) {
            throw new common_1.NotFoundException('Regional Manager not found');
        }
        const assignedUserCount = await this.usersRepository.count({
            where: {
                rmId: regionalManager.id,
                role: 'user',
            },
        });
        if (assignedUserCount >= 20) {
            throw new common_1.BadRequestException('This Regional Manager has reached the maximum limit of 20 assigned users.');
        }
        user.rmId = regionalManager.id;
        await this.usersRepository.save(user);
        const hydratedUser = await this.usersRepository.findOneOrFail({
            where: {
                id: user.id,
            },
            relations: {
                accountant: true,
                regionalManager: true,
            },
        });
        return (0, identity_mapper_1.toUserResource)(hydratedUser);
    }
    async updateProfile(userId, dto) {
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
            relations: {
                accountant: true,
                regionalManager: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (dto.email) {
            const existingEmailUser = await this.usersRepository.findOne({
                where: {
                    email: dto.email.trim().toLowerCase(),
                },
            });
            if (existingEmailUser && existingEmailUser.id !== user.id) {
                throw new common_1.ConflictException('Email is already in use');
            }
        }
        if (dto.mobile_number) {
            const existingMobileUser = await this.usersRepository.findOne({
                where: {
                    mobileNumber: dto.mobile_number,
                },
            });
            if (existingMobileUser && existingMobileUser.id !== user.id) {
                throw new common_1.ConflictException('Mobile number is already in use');
            }
        }
        if (dto.name !== undefined)
            user.name = dto.name;
        if (dto.email !== undefined)
            user.email = dto.email.trim().toLowerCase();
        if (dto.mobile_number !== undefined)
            user.mobileNumber = dto.mobile_number;
        if (dto.address !== undefined)
            user.address = dto.address;
        if (dto.city !== undefined)
            user.city = dto.city;
        if (dto.state !== undefined)
            user.state = dto.state;
        if (dto.pincode !== undefined)
            user.pincode = dto.pincode;
        await this.usersRepository.save(user);
        const hydratedUser = await this.usersRepository.findOneOrFail({
            where: {
                id: user.id,
            },
            relations: {
                accountant: true,
                regionalManager: true,
            },
        });
        return (0, identity_mapper_1.toUserResource)(hydratedUser);
    }
    async changePassword(userId, dto) {
        if (dto.new_password !== dto.new_password_confirmation) {
            throw new common_1.BadRequestException('New passwords do not match');
        }
        if (dto.current_password === dto.new_password) {
            throw new common_1.BadRequestException('New password must be different from current password');
        }
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const passwordMatches = await (0, bcryptjs_1.compare)(dto.current_password, normalizePasswordHash(user.password));
        if (!passwordMatches) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        user.password = await (0, bcryptjs_1.hash)(dto.new_password, 10);
        await this.usersRepository.save(user);
        return null;
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProfileService);
function normalizePasswordHash(passwordHash) {
    return passwordHash.startsWith('$2y$')
        ? `$2a$${passwordHash.slice(4)}`
        : passwordHash;
}
//# sourceMappingURL=profile.service.js.map