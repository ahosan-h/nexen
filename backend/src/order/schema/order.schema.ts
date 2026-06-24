import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema({ timestamps: true })
export class orderModel extends Document {
  @Prop({ required: true })
  barcode!: string;
  @Prop({ required: true })
  quantity!: number;
  @Prop({ required: true })
  total!: number;
  @Prop({ required: true })
  productname!: string;
}
export const orderSchema = SchemaFactory.createForClass(orderModel);
