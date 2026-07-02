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
    @Inject('ANALYTICS_TOKEN')
    private readonly analyticschannel: amqp.Channel, // 🟢 Updated type to standard Channel
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
        .find({ status: 'pending' })
        .limit(25)
        .exec();

      if (pullmessage.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`📦 Processing outbox batch of size: ${pullmessage.length}`);

      // 2. Extract IDs for an atomic batch update
      const msgIds = pullmessage.map((msg) => msg._id);

      // 3. Mark them processed instantly BEFORE publishing
      await this.outboxDbModel.updateMany(
        { _id: { $in: msgIds } },
        { $set: { status: 'processing' } },
      );

      // 4. Safely broadcast the messages out to RabbitMQ
      for (const msg of pullmessage) {
        try {
          // 🟢 Fire-and-forget publication (Instant transfer over standard channel socket)
          this.analyticschannel.publish(
            msg.exchange,
            msg.routingKey,
            Buffer.from(JSON.stringify(msg.payload)),
            { persistent: true },
          );

          // 🟢 Because it is a standard channel, it transmits instantly. Mark as 'sent' immediately.
          await this.outboxDbModel.updateOne(
            { _id: msg._id },
            { $set: { status: 'sent' } },
          );
        } catch (publishError: any) {
          console.error(
            `❌ Failed to publish outbox entry ${msg._id}:`,
            publishError.message || publishError,
          );

          // Fallback: Revert this single entry to 'pending' if the socket transmission failed
          await this.outboxDbModel.updateOne(
            { _id: msg._id },
            { $set: { status: 'pending' } },
          );
        }
      }
    } catch (globalError) {
      console.error('❌ Error executing Outbox batch process:', globalError);
    } finally {
      this.isProcessing = false;
    }
  }

  onModuleDestroy() {
    if (this.poolInterval) clearInterval(this.poolInterval);
  }
}
