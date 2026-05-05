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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
const typeorm_1 = require("typeorm");
let UserEntity = class UserEntity {
    id;
    name;
    email;
    password;
    role;
    mobileNumber;
    isMobileVerified;
    referralCode;
    rmUniqueId;
    accountantUniqueId;
    rmId;
    accountantId;
    address;
    city;
    state;
    pincode;
    regionalManager;
    assignedUsers;
    accountant;
    assignedAccountantUsers;
    createdAt;
    updatedAt;
};
exports.UserEntity = UserEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], UserEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], UserEntity.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role', type: 'varchar', length: 255, default: 'user' }),
    __metadata("design:type", String)
], UserEntity.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'mobile_number',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserEntity.prototype, "mobileNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_mobile_verified', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserEntity.prototype, "isMobileVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'referral_code',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserEntity.prototype, "referralCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'rm_unique_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserEntity.prototype, "rmUniqueId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'accountant_unique_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserEntity.prototype, "accountantUniqueId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rm_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], UserEntity.prototype, "rmId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accountant_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], UserEntity.prototype, "accountantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], UserEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'city', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], UserEntity.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'state', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], UserEntity.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pincode', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], UserEntity.prototype, "pincode", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserEntity, (user) => user.assignedUsers, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'rm_id' }),
    __metadata("design:type", Object)
], UserEntity.prototype, "regionalManager", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserEntity, (user) => user.regionalManager),
    __metadata("design:type", Array)
], UserEntity.prototype, "assignedUsers", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserEntity, (user) => user.assignedAccountantUsers, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'accountant_id' }),
    __metadata("design:type", Object)
], UserEntity.prototype, "accountant", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserEntity, (user) => user.accountant),
    __metadata("design:type", Array)
], UserEntity.prototype, "assignedAccountantUsers", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UserEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], UserEntity.prototype, "updatedAt", void 0);
exports.UserEntity = UserEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'users' })
], UserEntity);
//# sourceMappingURL=user.entity.js.map