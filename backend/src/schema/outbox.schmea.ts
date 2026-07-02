import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type outboxstatus = 'pending' | 'processing' | 'sent';
@Schema({ timestamps: true })
export class outboxModel extends Document {
  @Prop({ required: true })
  exchange!: string;
  @Prop({ required: true })
  routingKey!: string;
  @Prop({ type: Object, required: true })
  payload!: Record<string, any>;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'sent'],
    default: 'pending',
  })
  status!: outboxstatus;
}
export const outboxSchema = SchemaFactory.createForClass(outboxModel);
