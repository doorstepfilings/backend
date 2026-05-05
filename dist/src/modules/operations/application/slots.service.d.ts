import { Repository } from 'typeorm';
import { UserServiceEntity } from '../infrastructure/persistence/user-service.entity';
export declare class SlotsService {
    private readonly userServicesRepository;
    private readonly SLOT_CAPACITY;
    constructor(userServicesRepository: Repository<UserServiceEntity>);
    getAvailability(serviceId: number, date: string): Promise<{
        time: string;
        booked: number;
        remaining: number;
        is_full: boolean;
        is_past: boolean;
    }[]>;
}
