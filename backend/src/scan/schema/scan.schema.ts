import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Scan extends Document {
  @Prop({ required: true, unique: true })
  qrcode!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  price!: string;

  @Prop({ required: true })
  quantity!: number;

  @Prop()
  description!: string;

  @Prop({ required: true })
  addedby!: string;
}

export const ScanSchema = SchemaFactory.createForClass(Scan);
