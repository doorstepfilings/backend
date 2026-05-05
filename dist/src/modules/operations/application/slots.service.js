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
exports.SlotsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_service_entity_1 = require("../infrastructure/persistence/user-service.entity");
let SlotsService = class SlotsService {
    userServicesRepository;
    SLOT_CAPACITY = 10;
    constructor(userServicesRepository) {
        this.userServicesRepository = userServicesRepository;
    }
    async getAvailability(serviceId, date) {
        const timeSlots = [];
        for (let hour = 10; hour < 19; hour++) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
            timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        timeSlots.push('19:00');
        const inactiveStatuses = ['in_cart', 'cancelled', 'rejected'];
        const query = this.userServicesRepository
            .createQueryBuilder('us')
            .select("JSON_UNQUOTE(JSON_EXTRACT(us.form_data, '$.scheduled_time'))", 'scheduled_time')
            .addSelect('COUNT(*)', 'count')
            .where('us.service_id = :serviceId', { serviceId })
            .andWhere('us.status NOT IN (:...statuses)', {
            statuses: inactiveStatuses,
        })
            .andWhere("JSON_UNQUOTE(JSON_EXTRACT(us.form_data, '$.scheduled_date')) = :date", { date })
            .groupBy('scheduled_time');
        const results = await query.getRawMany();
        const bookingsMap = results.reduce((acc, curr) => {
            acc[curr.scheduled_time] = Number.parseInt(curr.count, 10);
            return acc;
        }, {});
        const now = new Date();
        const targetDate = new Date(date);
        return timeSlots.map((slot) => {
            const booked = bookingsMap[slot] || 0;
            const [hour, minute] = slot.split(':').map(Number);
            const slotDate = new Date(targetDate);
            slotDate.setHours(hour, minute, 0, 0);
            return {
                time: slot,
                booked,
                remaining: Math.max(0, this.SLOT_CAPACITY - booked),
                is_full: booked >= this.SLOT_CAPACITY,
                is_past: slotDate <= now,
            };
        });
    }
};
exports.SlotsService = SlotsService;
exports.SlotsService = SlotsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_service_entity_1.UserServiceEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SlotsService);
//# sourceMappingURL=slots.service.js.map