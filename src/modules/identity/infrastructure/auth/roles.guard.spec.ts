import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  it('reads class-level role metadata when handler metadata is absent', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['regional_manager']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            role: 'regional_manager',
          },
        }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride as jest.Mock).toHaveBeenCalledWith(
      'roles',
      [context.getHandler(), context.getClass()],
    );
  });

  it('matches roles exactly', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['rm']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            role: 'regional_manager',
          },
        }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(false);
  });
});
