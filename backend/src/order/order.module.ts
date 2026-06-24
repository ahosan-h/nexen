import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { orderModel, orderSchema } from './schema/order.schema';
import { Scan, ScanSchema } from 'src/scan/schema/scan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: orderModel.name, schema: orderSchema },
      { name: Scan.name, schema: ScanSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
