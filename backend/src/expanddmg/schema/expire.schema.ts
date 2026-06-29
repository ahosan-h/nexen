import { Prop } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Scan } from 'src/scan/schema/scan.schema';

export class expireModel extends Document {
  @Prop({ required: true })
  catagory!: string;
  @Prop({ required: true })
  name!: true;
  @Prop({ required: true })
  reportedby!: string;
}
