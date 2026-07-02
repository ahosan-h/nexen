import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema({ timestamps: true })
export class processedeventModel extends Document {
  @Prop({ required: true, unique: true, key: true })
  eventId!: string;
  @Prop({ required: true, unique: true, key: true })
  businessId!: string;
}
export const ProcessedEventSchema =
  SchemaFactory.createForClass(processedeventModel);
