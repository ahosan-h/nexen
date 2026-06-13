import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  clerkId!: string;

  @Prop({ required: true, trim: true })
  email!: string;

  @Prop({ trim: true })
  name!: string;
}

export const userSchema = SchemaFactory.createForClass(User);
