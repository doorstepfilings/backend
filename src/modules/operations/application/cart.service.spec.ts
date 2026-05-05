import { CartService } from './cart.service';
import { Repository } from 'typeorm';
import { ServiceEntity } from '../../catalog/infrastructure/persistence/service.entity';
import { EnquiryEntity } from '../../customer/infrastructure/persistence/enquiry.entity';
import { UserEntity } from '../../identity/infrastructure/persistence/user.entity';
import { UserServiceEntity } from '../infrastructure/persistence/user-service.entity';

describe('CartService', () => {
    let service: CartService;
    let userServiceRepo: {
        delete: jest.Mock;
        findOne: jest.Mock;
        findOneOrFail: jest.Mock;
    };
    let servicesRepo: Record<string, never>;
    let usersRepo: Record<string, never>;
    let enquiriesRepo: Record<string, never>;

    beforeEach(() => {
        userServiceRepo = {
            delete: jest.fn(),
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
        };
        servicesRepo = {};
        usersRepo = {};
        enquiriesRepo = {};
        service = new CartService(
            userServiceRepo as unknown as Repository<UserServiceEntity>,
            servicesRepo as unknown as Repository<ServiceEntity>,
            usersRepo as unknown as Repository<UserEntity>,
            enquiriesRepo as unknown as Repository<EnquiryEntity>,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('removeFromCart', () => {
        it('should delete a cart item', async () => {
            const userId = 1;
            const itemId = 100;

            userServiceRepo.findOne.mockResolvedValue({
                id: itemId,
                userId,
                status: 'in_cart',
            });

            userServiceRepo.delete.mockResolvedValue({});

            await service.removeFromCart(userId, itemId);
            expect(userServiceRepo.delete).toHaveBeenCalledWith({ id: itemId });
        });
    });
});
