import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnvironment } from '../../../../config/environment';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  getStatus() {
    const appEnvironment = this.configService.getOrThrow<AppEnvironment>('app');

    return {
      apiPrefix: appEnvironment.apiPrefix,
      environment: appEnvironment.nodeEnv,
      service: appEnvironment.appName,
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
