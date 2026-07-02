import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema({ timestamps: true })
export class outboxModel extends Document {
  @Prop({ required: true })
  exchange!: string;
  @Prop({ required: true })
  routingKey!: string;
  @Prop({ type: Object, required: true })
  payload!: Record<string, any>;
  @Prop({ default: false })
  processed!: boolean;
}
export const outboxSchema = SchemaFactory.createForClass(outboxModel);
