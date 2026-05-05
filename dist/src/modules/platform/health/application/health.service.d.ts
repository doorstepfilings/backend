import { ConfigService } from '@nestjs/config';
export declare class HealthService {
    private readonly configService;
    constructor(configService: ConfigService);
    getStatus(): {
        apiPrefix: string;
        environment: string;
        service: string;
        status: string;
        timestamp: string;
    };
}
