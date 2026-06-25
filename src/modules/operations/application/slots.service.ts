import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import { USER_SERVICE_PAYMENT_PENDING_STATUS } from './payment-status';

@Injectable()
export class SlotsService {
  private readonly SLOT_CAPACITY = 10;

  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(serviceId: number, date: string) {
    const timeSlots: string[] = [];
    for (let hour = 10; hour < 19; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    timeSlots.push('19:00');

    // Using raw query for JSON extraction and grouping
    const results = await this.prisma.$queryRaw<any[]>`
            SELECT 
                form_data->>'scheduled_time' as scheduled_time,
                COUNT(*) as count
            FROM user_services
            WHERE service_id = ${serviceId}
              AND status NOT IN ('in_cart', ${USER_SERVICE_PAYMENT_PENDING_STATUS}, 'cancelled', 'rejected', 'approved', 'completed')
              AND form_data->>'scheduled_date' = ${date}
            GROUP BY form_data->>'scheduled_time'
        `;

    const bookingsMap = results.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.scheduled_time] = Number(curr.count);
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
}
