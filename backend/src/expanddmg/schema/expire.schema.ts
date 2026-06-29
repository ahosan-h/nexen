import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema({ timestamps: true })
export class expireModel extends Document {
  @Prop({ required: true })
  catagory!: string;
  @Prop({ required: true })
  name!: string;
  @Prop({ required: true })
  reportedby!: string;
}
export const expireSchema = SchemaFactory.createForClass(expireModel);
