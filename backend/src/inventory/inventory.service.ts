import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { orderModel } from 'src/order/schema/order.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(orderModel.name)
    private readonly orderModel: Model<orderModel>,
  ) {}
  async ordertrigger(
    barcode: string,
    quantity: number,
    total: number,
    productname: string,
  ) {
    const createorder = await this.orderModel.create({
      barcode,
      quantity,
      total,
      productname,
    });
    return createorder;
  }
}
