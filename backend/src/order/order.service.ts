import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { orderModel } from './schema/order.schema';
import { Model } from 'mongoose';
import { Scan } from 'src/scan/schema/scan.schema';
import * as amqp from 'amqplib';
@Injectable()
export class OrderService {
  constructor(
    @InjectModel(orderModel.name)
    private readonly oroderModel: Model<orderModel>,
    @InjectModel(Scan.name) private readonly scanModel: Model<Scan>,
    //inject the custom tokne here
    @Inject('ORDER_TOKEN') private readonly amqpChannel: amqp.Channel,
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
    //get ready the payload for sending into the
    //inventory sync
    const inventory_payload = {
      barcode: barcode,
      quantity: quantity,
      total: total,
      productname: findproduct?.name,
    };
    //now publish the event

    //define the exchange name
    const exchange = 'ORDER_EXCHANGE';
    const routingKey = 'INVENTORY_KEY';
    //transmit the message
    this.amqpChannel.publish(
      exchange,
      routingKey,
      //convert the message in to buffer from and send
      Buffer.from(JSON.stringify(inventory_payload)),
    );
  }
}
