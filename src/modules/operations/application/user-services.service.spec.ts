import { UserServicesService } from './user-services.service';

describe('UserServicesService', () => {
  let prismaMock: any;
  let service: UserServicesService;

  beforeEach(() => {
    prismaMock = {
      userService: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      payment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      serviceRequestDocument: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    service = new UserServicesService(prismaMock as any, {} as any, {} as any);
  });

  it('queries only paid services for the user dashboard', async () => {
    await service.getMyServices(7);

    expect(prismaMock.userService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          paymentStatus: {
            in: ['PAID', 'paid', 'success'],
          },
          status: {
            notIn: ['in_cart', 'payment_pending'],
          },
          userId: 7,
        },
      }),
    );
  });
});
