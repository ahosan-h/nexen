import { Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import * as amqp from 'amqplib';
import { MongooseModule } from '@nestjs/mongoose';
import { analyticsModel, analyticsSchmea } from './schema/analytics.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';

//deifne the dlq and main queue
const dlq_queue_analytics = 'DLQ_ANALYTICS';
const analytics_queue = 'ANALYTICS_QUEUE';
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: analyticsModel.name, schema: analyticsSchmea },
    ]),
  ],
  providers: [
    AnalyticsService,
    //consumer for analytics
    //event comming from the order
    {
      provide: 'ANALYTICS_TOKEN',
      useFactory: async (ConfigService: ConfigService) => {
        const cloudamqp =
          ConfigService.get<string>('CLOUDAMQP_URL') || 'amqp://localhost:5672';
        const connect = await amqp.connect(cloudamqp);
        const channel = await connect.createChannel();

        const dlq_excahange = 'ANALYTICS_DLQ_EXCHANGE';
        const exchange = 'ANALYTICS_EXCHANGE';

        await channel.assertExchange(dlq_excahange, 'direct', {
          durable: true,
        });
        await channel.assertQueue(dlq_queue_analytics, { durable: true });
        await channel.bindQueue(
          dlq_queue_analytics,
          dlq_excahange,
          'ANALYTICS_FALIED',
        );
        //main queue
        await channel.assertExchange(exchange, 'direct', { durable: true });
        await channel.assertQueue(analytics_queue, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': dlq_excahange,
            'x-dead-letter-routing-key': 'ALANYTICS_FAILED',
          },
        });
        await channel.bindQueue(analytics_queue, exchange, 'ANALYTICS_KEY');
        return channel;
      },
      inject: [ConfigService],
    },
  ],
})
export class AnalyticsModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('ANALYTICS_TOKEN') private readonly anlayticsChannel: amqp.Channel,
    private readonly analyticsService: AnalyticsService,
  ) {}
  async onModuleInit() {
    await this.anlayticsChannel.consume(analytics_queue, async (msg) => {
      if (msg !== null) {
        try {
          const anlaytics_decode = JSON.parse(msg.content.toString());
          await this.analyticsService.analyticstigger(
            anlaytics_decode.productId,
            anlaytics_decode.productname,
            anlaytics_decode.quantity,
            anlaytics_decode.total,
          );
          this.anlayticsChannel.ack(msg);
        } catch (error) {
          console.log(error);
          this.anlayticsChannel.nack(msg, false, false);
        }
      }
    });
  }
  async onModuleDestroy() {
    try {
      await this.anlayticsChannel.close();
    } catch (error) {
      console.log(error);
    }
  }
}
//export class AnalyticsModule {}
