import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns the backend runtime status snapshot', () => {
    const getOrThrow = jest.fn().mockReturnValue({
      apiPrefix: 'api',
      appName: 'doorstep-backend',
      frontendUrl: 'http://127.0.0.1:3000',
      nodeEnv: 'test',
      port: 4000,
    });
    const configService = { getOrThrow } as unknown as ConfigService;

    const service = new HealthService(configService);
    const result = service.getStatus();

    expect(getOrThrow).toHaveBeenCalledWith('app');
    expect(result).toMatchObject({
      apiPrefix: 'api',
      environment: 'test',
      service: 'doorstep-backend',
      status: 'ok',
    });
  });
});
