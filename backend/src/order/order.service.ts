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
    //inject the custom tokne  for order here
    @Inject('ORDER_TOKEN') private readonly amqpChannel: amqp.Channel,
    //injecting the anlaytics custom token
    @Inject('ANALYTICS_TOKEN') private readonly analyticsChannel: amqp.Channel,
  ) {}
  //place order
  async placeorder(barcode: string, quantity: number) {
    //find the product
    const findproduct = await this.scanModel
      .findOne({ barcode })
      .select('_id name price quantity');
    //verify if product exist
    if (!findproduct) {
      throw new Error(' no product found ');
    }
    //verify quantity
    if (findproduct?.quantity < quantity) {
      throw new Error('not enough quantity');
    }
    //calculate total
    const total = findproduct?.bprice * quantity;

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

    //getting ready payload for the analytics
    const analytics_payload = {
      productId: findproduct?._id,
      productname: findproduct?.name,
      quantity: quantity,
      total: total,
    };
    //define the exchange name and rouitng key
    const exchaneg_analytics = 'ANALYTICS_EXCHANGE';
    const routingKey_analytics = 'ANALYTICS_KEY';
    //transmit the message
    this.analyticsChannel.publish(
      exchaneg_analytics,
      routingKey_analytics,
      Buffer.from(JSON.stringify(analytics_payload)),
    );
  }
}
