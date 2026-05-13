import { CartService } from './cart.service';

describe('CartService', () => {
    let service: CartService;
    let prismaMock: any;

    beforeEach(() => {
        prismaMock = {
            userService: {
                findFirst: jest.fn(),
                delete: jest.fn(),
            },
        };
        service = new CartService(prismaMock as any);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
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
                where: { id: itemId }
            });
        });
    });
});
