import { Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { MongooseModule } from '@nestjs/mongoose';
import { orderModel, orderSchema } from 'src/order/schema/order.schema';
import * as amqp from 'amqplib';
import { ConfigModule, ConfigService } from '@nestjs/config';
const dlq_queue_inventor = 'DLQ_INVENTORY';
const queue_for_inventory = 'INVENTORY_QUEUE';
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: orderModel.name, schema: orderSchema }]),
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    {
      //thi will be consumer for inventory sync on order

      //custom token
      provide: 'INVENTORY_TOKEN',
      //configure connection string
      // wil get conneciton object
      useFactory: async (ConfigService: ConfigService) => {
        //url
        const cloudamqp =
          ConfigService.get<string>('CLOUDAMQP_URL') ||
          'amqp://localohost:5672';
        //connct the link
        const connect = await amqp.connect(cloudamqp);
        //create the channel
        const channel = await connect.createChannel();
        //exchange declarations
        const dlq_order_exchange = 'DLQ_ORDER_EXCHANGE';
        //main exchnage
        const exchange = 'ORDER_EXCHANGE';
        //configure dlq
        //assert channnel
        await channel.assertExchange(dlq_order_exchange, 'direct', {
          durable: true,
        });
        //assert queue
        await channel.assertQueue(dlq_queue_inventor, { durable: true });
        //bind queue
        await channel.bindQueue(
          dlq_queue_inventor,
          dlq_order_exchange,
          'INVENTORY_FAILED',
        );
        //configuration for main queue
        await channel.assertExchange(exchange, 'direct', { durable: true });
        //assert queue
        await channel.assertQueue(queue_for_inventory, {
          durable: true,
          //fallback will go to dlq queue
          arguments: {
            'x-dead-letter-exchange': dlq_order_exchange,
            'x-dead-letter-routing-key': 'INVENTORY_FAILED',
          },
        });
        //bind queue
        await channel.bindQueue(queue_for_inventory, exchange, 'INVENTORY_KEY');
        return channel;
      },
      inject: [ConfigService],
    },
  ],
})
//whne this module will be executed
// a live connnction will be staublish with a
//async function which will consume the evnts
export class InventoryModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    //inject the token here
    @Inject('INVENTORY_TOKEN') private readonly inventoryChannel: amqp.Channel,
    //instant the service
    private readonly inventoryService: InventoryService,
  ) {}
  //the function that will listen formeaasgse
  async onModuleInit() {
    //listen to the message  from the queue
    await this.inventoryChannel.consume(queue_for_inventory, async (msg) => {
      if (msg !== null) {
        try {
          //dceode the payload
          const payload_decode_inventory = JSON.parse(msg.content.toString());
          //call the service method for db operation
          await this.inventoryService.ordertrigger(
            payload_decode_inventory.barcode,
            payload_decode_inventory.quantity,
            payload_decode_inventory.total,
            payload_decode_inventory.productname,
          );
          //confirm thta consumer recive messgae
          //by acknowledge
          this.inventoryChannel.ack(msg);
        } catch (error) {
          console.log(error);
          //mark acknowledgement false and sent back for retery
          this.inventoryChannel.nack(msg, false, false);
        }
      }
    });
  }
  async onModuleDestroy() {
    //clsoe the connection
    try {
      await this.inventoryChannel.close();
    } catch (error) {
      console.log(error);
    }
  }
}
//export class InventoryModule {}
