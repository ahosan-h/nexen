import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { orderModel, orderSchema } from './schema/order.schema';
import { Scan, ScanSchema } from 'src/scan/schema/scan.schema';
import * as amqp from 'amqplib';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { outboxModel, outboxSchema } from 'src/schema/outbox.schmea';
import { Outboxworker } from 'src/rmq.worker';
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: orderModel.name, schema: orderSchema },
      { name: Scan.name, schema: ScanSchema },
      { name: outboxModel.name, schema: outboxSchema },
    ]),
  ],
  controllers: [OrderController],
  //modifying module for producing the event
  providers: [
    OrderService,
    Outboxworker,
    //this one will responsible for inventory_sync
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
    //this one will be responsible for analytics
    {
      //custom token
      provide: 'ANALYTICS_TOKEN',
      //get connection object with usefactory using the
      //connection url
      useFactory: async (ConfigService: ConfigService) => {
        //rmq url for conection
        const cloudurl =
          ConfigService.get<string>('CLOUDAMQP_URL') || 'amqp://localhost:5672';
        //connect with this
        const connect = await amqp.connect(cloudurl);
        //create channel
        const channel = await connect.createChannel();
        //define exchange for analytics
        const exchange = 'ANALYTICS_EXCHANGE';
        //assert the exchage in the channel
        await channel.assertExchange(exchange, 'direct', { durable: true });
        return channel;
      },
      inject: [ConfigService],
    },
  ],
})
export class OrderModule {}
