import { SlotsService } from '../../application/slots.service';
export declare class SlotsController {
    private readonly slotsService;
    constructor(slotsService: SlotsService);
    getAvailability(serviceId: number, date: string): Promise<{
        success: boolean;
        message: string;
        data: {
            time: string;
            booked: number;
            remaining: number;
            is_full: boolean;
            is_past: boolean;
        }[];
    }>;
}
