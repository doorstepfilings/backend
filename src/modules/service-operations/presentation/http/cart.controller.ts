import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { successResponse } from '../../../../shared/http/api-response';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { CurrentAuthUser } from '../../../identity/presentation/http/current-auth-user.decorator';
import { CartService } from '../../application/cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('service/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  async addToCart(
    @CurrentAuthUser() authUser: { userId: number },
    @Body() addToCartDto: AddToCartDto,
  ) {
    const item = await this.cartService.addToCart(
      authUser.userId,
      addToCartDto,
    );

    return successResponse(item, 'Service added to cart successfully');
  }

  @Get()
  async getCart(@CurrentAuthUser() authUser: { userId: number }) {
    const items = await this.cartService.getCart(authUser.userId);

    return successResponse(items);
  }

  @Delete(':id')
  async removeFromCart(
    @CurrentAuthUser() authUser: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.cartService.removeFromCart(authUser.userId, id);

    return successResponse(null, 'Service removed from cart');
  }
}
