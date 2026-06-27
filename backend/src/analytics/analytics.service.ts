import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { analyticsModel } from './schema/analytics.schema';
import { Model } from 'mongoose';
import * as amqp from 'amqplib';
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(analyticsModel.name)
    private readonly analyticsModel: Model<analyticsModel>,
    @Inject('ANALYTICS_TOKEN') private readonly analyticsChannel: amqp.Channel,
  ) {}
  //create analytics record
  async analyticstigger(
    productId: string,
    productname: string,
    quantity: number,
    total: number,
  ) {
    const record_analytics = await this.analyticsModel.create({
      productId,
      productname,
      quantity,
      total,
    });
    return record_analytics;
  }
}
