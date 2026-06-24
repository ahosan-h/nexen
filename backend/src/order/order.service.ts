import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { orderModel } from './schema/order.schema';
import { Model } from 'mongoose';
import { Scan } from 'src/scan/schema/scan.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(orderModel.name)
    private readonly oroderModel: Model<orderModel>,
    @InjectModel(Scan.name) private readonly scanModel: Model<Scan>,
  ) {}
  //place order
  async placeorder(barcode: string, quantity: number) {
    //find the product
    const findproduct = await this.scanModel
      .findOne({ barcode })
      .select('name price quantity');
    //verify if product exist
    if (!findproduct) {
      throw new Error(' no product found ');
    }
    //verify quantity
    if (findproduct?.quantity < quantity) {
      throw new Error('not enough quantity');
    }
    //calculate total
    const total = findproduct?.price * quantity;

    //decremnt stock
    const adjust_stock = await this.scanModel.findOneAndUpdate(
      {
        _id: findproduct._id,
        quantity: { $gte: quantity },
      },
      {
        $inc: { quantity: -quantity },
      },
      { new: true },
    );
    if (!adjust_stock) {
      throw new Error('failed to adjust stock ');
    }
    return this.oroderModel.create({
      barcode,
      quantity,
      total: total,
      productname: findproduct?.name,
    });
  }
}
