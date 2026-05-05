import { HealthService } from '../../application/health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getStatus(): {
        apiPrefix: string;
        environment: string;
        service: string;
        status: string;
        timestamp: string;
    };
}
