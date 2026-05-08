import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserServiceEntity } from '../infrastructure/persistence/user-service.entity';

@Injectable()
export class SlotsService {
    private readonly SLOT_CAPACITY = 10;

    constructor(
        @InjectRepository(UserServiceEntity)
        private readonly userServicesRepository: Repository<UserServiceEntity>,
    ) {}

    async getAvailability(serviceId: number, date: string) {
        const timeSlots: string[] = [];
        for (let hour = 10; hour < 19; hour++) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
            timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        timeSlots.push('19:00');

        const inactiveStatuses = ['in_cart', 'cancelled', 'rejected', 'approved', 'completed'];

        const query = this.userServicesRepository
            .createQueryBuilder('us')
            .select(
                "JSON_UNQUOTE(JSON_EXTRACT(us.form_data, '$.scheduled_time'))",
                'scheduled_time',
            )
            .addSelect('COUNT(*)', 'count')
            .where('us.service_id = :serviceId', { serviceId })
            .andWhere('us.status NOT IN (:...statuses)', {
                statuses: inactiveStatuses,
            })
            .andWhere(
                "JSON_UNQUOTE(JSON_EXTRACT(us.form_data, '$.scheduled_date')) = :date",
                { date },
            )
            .groupBy('scheduled_time');

        const results = await query.getRawMany<{
            count: string;
            scheduled_time: string;
        }>();
        const bookingsMap = results.reduce<Record<string, number>>(
            (acc, curr) => {
                acc[curr.scheduled_time] = Number.parseInt(curr.count, 10);
                return acc;
            },
            {},
        );

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
}
