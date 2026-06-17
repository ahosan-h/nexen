import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Scan extends Document {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true, unique: true, trim: true })
  barcode!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  quantity!: number;

  @Prop()
  description!: string;

  @Prop({ required: true, trim: true })
  addedby!: string;
}

export const ScanSchema = SchemaFactory.createForClass(Scan);
