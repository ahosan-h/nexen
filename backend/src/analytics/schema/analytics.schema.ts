import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema({ timestamps: true })
export class analyticsModel extends Document {
  @Prop({ required: true })
  productId!: string;
  @Prop({ required: true })
  productname!: string;
  @Prop({ required: true })
  quantity!: number;
  @Prop({ required: true })
  total!: number;
}
export const analyticsSchmea = SchemaFactory.createForClass(analyticsModel);
