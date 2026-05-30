import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      enquiry: {
        create: jest.fn(),
      },
      service: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      userService: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new CartService(prismaMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToCart', () => {
    it('allows the same service to be added to the cart multiple times', async () => {
      const userId = 1;
      const addToCartDto = {
        service_id: 9,
        form_data: {
          company_name: 'Acme Pvt Ltd',
        },
      };
      const catalogService = {
        id: 9,
        serviceCategoryId: 3,
        name: 'GST Registration',
        slug: 'gst-registration',
        shortDescription: 'GST registration support',
        description: 'Register for GST',
        longDescription: null,
        link: null,
        price: '999.00',
        faqs: [],
        pricingPlans: [],
        requiredDocumentsList: [],
        extraDocuments: [],
        adminNotes: null,
        category: {
          id: 3,
          name: 'Tax',
          slug: 'tax',
          description: null,
          icon: null,
        },
        documents: [],
      };
      const user = {
        id: userId,
        email: 'user@example.com',
        mobileNumber: '9999999999',
        name: 'Test User',
      };
      const firstCartItem = {
        id: 101,
        serviceId: 9,
        userId,
        status: 'in_cart',
        paymentStatus: 'CREATED',
        formData: addToCartDto.form_data,
        documents: null,
        amount: '999.00',
        notes: null,
        revisionNotes: null,
        caNotes: null,
        updateNote: null,
        rejectionReason: null,
        verified: false,
        certificateUrl: null,
        submittedToCaAt: null,
        createdAt: new Date('2026-05-15T09:00:00.000Z'),
        updatedAt: new Date('2026-05-15T09:00:00.000Z'),
        service: catalogService,
      };
      const secondCartItem = {
        ...firstCartItem,
        id: 102,
        createdAt: new Date('2026-05-15T09:05:00.000Z'),
        updatedAt: new Date('2026-05-15T09:05:00.000Z'),
      };

      prismaMock.service.findUnique.mockResolvedValue(catalogService);
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.userService.create
        .mockResolvedValueOnce({ id: 101 })
        .mockResolvedValueOnce({ id: 102 });
      prismaMock.userService.findUniqueOrThrow
        .mockResolvedValueOnce(firstCartItem)
        .mockResolvedValueOnce(secondCartItem);

      await service.addToCart(userId, addToCartDto);
      await service.addToCart(userId, addToCartDto);

      expect(prismaMock.userService.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.userService.create).toHaveBeenNthCalledWith(1, {
        data: {
          serviceId: 9,
          status: 'in_cart',
          userId,
          formData: addToCartDto.form_data,
          amount: '999.00',
        },
      });
      expect(prismaMock.userService.create).toHaveBeenNthCalledWith(2, {
        data: {
          serviceId: 9,
          status: 'in_cart',
          userId,
          formData: addToCartDto.form_data,
          amount: '999.00',
        },
      });
    });
  });

  describe('removeFromCart', () => {
    it('should delete a cart item', async () => {
      const userId = 1;
      const itemId = 100;

      prismaMock.userService.findFirst.mockResolvedValue({
        id: itemId,
        userId,
        status: 'in_cart',
      });

      prismaMock.userService.delete.mockResolvedValue({});

      await service.removeFromCart(userId, itemId);
      expect(prismaMock.userService.delete).toHaveBeenCalledWith({
        where: { id: itemId },
      });
    });
  });
});
