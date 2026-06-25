import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { orderModel, orderSchema } from './schema/order.schema';
import { Scan, ScanSchema } from 'src/scan/schema/scan.schema';
import * as amqp from 'amqplib';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: orderModel.name, schema: orderSchema },
      { name: Scan.name, schema: ScanSchema },
    ]),
  ],
  controllers: [OrderController],
  //modifying module for producing the event
  providers: [
    OrderService,
    {
      //custom token for listening for rabbit mq

      provide: 'ORDER_TOKEN',
      //getting ready for connection object
      //will pass the rmq connection string and will get
      //connection oject
      useFactory: async (ConfigService: ConfigService) => {
        //cloud amqp link
        const cloudamqp =
          ConfigService.get<string>('CLOUDAMQP_URL') || 'amqp://localhost:5672';
        //connect with rmq
        const connect = await amqp.connect(cloudamqp);
        //create channel
        const channel = await connect.createChannel();
        //define exchamge name
        const exchange = 'ORDER_EXCHANGE';
        //assert the exchange inthe channel
        await channel.assertExchange(exchange, 'direct', {
          durable: true,
        });
        return channel;
      },
      inject: [ConfigService],
    },
  ],
})
export class OrderModule {}
