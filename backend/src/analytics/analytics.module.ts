import { Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import * as amqp from 'amqplib';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { analyticsModel, analyticsSchmea } from './schema/analytics.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  processedeventModel,
  ProcessedEventSchema,
} from 'src/schema/eventid.schmea';
import { Model } from 'mongoose';

//deifne the dlq and main queue
const dlq_queue_analytics = 'DLQ_ANALYTICS';
const analytics_queue = 'ANALYTICS_QUEUE';
const MAX_RETRY = 5;
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: analyticsModel.name, schema: analyticsSchmea },
      { name: processedeventModel.name, schema: ProcessedEventSchema },
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
        const channel = await connect.createConfirmChannel();

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
    @InjectModel(processedeventModel.name)
    private readonly processedeventModel: Model<processedeventModel>,
  ) {}
  async onModuleInit() {
    await this.anlayticsChannel.consume(analytics_queue, async (msg) => {
      if (msg !== null) {
        try {
          //decode the payload
          const anlaytics_decode = JSON.parse(msg.content.toString());
          //check for the event and business id
          const { eventId, businessId } = anlaytics_decode;
          if (!eventId || !businessId) {
            console.log(`uuid missing for ${anlaytics_decode}`);
            this.anlayticsChannel.ack(msg);
            return;
          }
          //check for duplicate
          const existevnet = await this.processedeventModel.exists({
            eventId: `analytics_${eventId}`,
          });
          const existbusiness = await this.processedeventModel.exists({
            businessId,
          });
          if (existevnet) {
            console.log('dupli detected');
            this.anlayticsChannel.ack(msg);
            return;
          }

          await this.processedeventModel.create({
            eventId: `analytics_${eventId}`,
            businessId: `analytics_${businessId}`,
          });

          await this.analyticsService.analyticstigger(
            anlaytics_decode.productId,
            anlaytics_decode.productname,
            anlaytics_decode.quantity,
            anlaytics_decode.total,
          );

          this.anlayticsChannel.ack(msg);
        } catch (error) {
          console.log(error);
          console.log('starting dlq retry ');
          //as retry count will be extracted from the head property
          //initiallly it doesnt have this . so use a fallback
          const headers = msg.properties.headers || {};
          let currtry =
            typeof headers['x-retry-count'] === 'number'
              ? headers['x-retry-count']
              : parseInt(headers['x-retry-count'] || '0', 10);
          if (currtry < MAX_RETRY) {
            const nxtretry = currtry + 1;
            console.log(`retrying ${nxtretry}`);
            const buffercontent = msg.content;
            const currheaders = msg.properties.headers || {};
            //retrying with a delay
            setTimeout(() => {
              this.anlayticsChannel.sendToQueue(
                analytics_queue,
                buffercontent,
                {
                  headers: {
                    ...currheaders,
                    'x-retry-count': nxtretry,
                  },
                },
              );
            }, 3000);
            this.anlayticsChannel.ack(msg);
          } else {
            console.log(error);
            this.anlayticsChannel.nack(msg, false, false);
          }
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
