import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { appEnvironment } from '../src/config/environment';
import { validateEnvironment } from '../src/config/environment.validation';
import { HealthService } from '../src/modules/platform/health/application/health.service';
import { HealthController } from '../src/modules/platform/health/presentation/http/health.controller';

describe('Platform HTTP Surface (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appEnvironment],
          validate: validateEnvironment,
        }),
      ],
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body['status']).toBe('ok');
        expect(typeof body['service']).toBe('string');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
