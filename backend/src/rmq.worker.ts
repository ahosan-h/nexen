import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as amqp from 'amqplib';
import { outboxModel } from './schema/outbox.schmea';
import { Model } from 'mongoose';

@Injectable()
export class Outboxworker implements OnModuleInit, OnModuleDestroy {
  private poolInterval!: NodeJS.Timeout;
  private isProcessing = false;

  constructor(
    @Inject('ORDER_TOKEN') private readonly orderchannel: amqp.Channel,
    @Inject('ANALYTICS_TOKEN') private readonly analyticschannel: amqp.Channel,
    @InjectModel(outboxModel.name)
    private readonly outboxDbModel: Model<outboxModel>,
  ) {}

  onModuleInit() {
    this.poolInterval = setInterval(() => this.processoutbox(), 5000);
  }

  async processoutbox() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Fetch pending outbox records
      const pullmessage = await this.outboxDbModel
        .find({ processed: false })
        .limit(25)
        .exec();

      if (pullmessage.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`📦 Processing outbox batch of size: ${pullmessage.length}`);

      // 2. Extract IDs for an atomic batch update
      const msgIds = pullmessage.map((msg) => msg._id);

      // 3. CRITICAL: Mark them processed instantly BEFORE publishing
      // This locks them so subsequent interval ticks ignore them entirely
      await this.outboxDbModel.updateMany(
        { _id: { $in: msgIds } },
        { $set: { processed: true } },
      );

      // 4. Safely broadcast the messages out to RabbitMQ
      for (const msg of pullmessage) {
        try {
          const activechannel =
            msg.exchange === 'ANALYTICS_EXCHANGE'
              ? this.analyticschannel
              : this.orderchannel;

          activechannel.publish(
            msg.exchange,
            msg.routingKey,
            Buffer.from(JSON.stringify(msg.payload)),
            { persistent: true },
          );
        } catch (publishError) {
          console.error(
            `❌ Failed to publish outbox entry ${msg._id}:`,
            publishError,
          );

          // Fallback: If publishing totally failed, revert this single item so it retries next tick
          await this.outboxDbModel.updateOne(
            { _id: msg._id },
            { $set: { processed: false } },
          );
        }
      }
    } catch (globalError) {
      console.error('❌ Error executing Outbox batch process:', globalError);
    }
    {
      this.isProcessing = false;
    }
  }

  onModuleDestroy() {
    if (this.poolInterval) clearInterval(this.poolInterval);
  }
}
