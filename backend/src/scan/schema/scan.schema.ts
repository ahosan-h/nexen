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

  //buying pirce
  @Prop({ required: true })
  bprice!: number;

  //selling price
  @Prop({ required: true })
  sprice!: number;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  category!: string;

  @Prop()
  description!: string;

  @Prop({ required: true, trim: true })
  addedby!: string;
}

export const ScanSchema = SchemaFactory.createForClass(Scan);
