import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { expireModel } from './schema/expire.schema';
import { Model } from 'mongoose';
import { Scan } from 'src/scan/schema/scan.schema';

@Injectable()
export class ExpanddmgService {
  constructor(
    @InjectModel(expireModel.name)
    private readonly expireModel: Model<expireModel>,
    @InjectModel(Scan.name) private readonly scanModel: Model<Scan>,
  ) {}
  //record the expiration report
  async record_expire(category: string, name: string, reportedby: string) {
    //find if the product  and catagory exists
    const findproduct = await this.scanModel
      .findOne({ name })
      .select('catagory');
    //if product not found
    if (!findproduct) {
      return { message: 'prodcyt not found ' };
    }
    if (findproduct?.category !== category) {
      return { message: 'catagory doesnt matched of this product ' };
    }
    //if  all okay  record the report
    return this.expireModel.create({
      catagory: findproduct.category,
      name,
      reportedby,
    });
  }
}
