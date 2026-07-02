import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { ClerkAuthGuard } from 'src/auth/guard/auth.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderServie: OrderService) {}
  @Post('/placeorder/:barcode')
  // @UseGuards(ClerkAuthGuard)
  placeorder(
    @Param('barcode') barcode: string,
    @Body('quantity') quantity: number,
  ) {
    return this.orderServie.placeorder(barcode, quantity);
  }
}
