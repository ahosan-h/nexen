import { Scan } from './schema/scan.schema';
import { InjectModel } from '@nestjs/mongoose';
import { ConflictException, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { createScanDto } from './dto/create-scan.dto';

@Injectable()
export class ScanService {
  constructor(@InjectModel(Scan.name) private scanModel: Model<Scan>) {}

  async findByBarCode(barcode: string) {
    return this.scanModel.findOne({ barcode });
  }

  async createProduct(userId: string, dto: createScanDto) {
    const existProduct = await this.findByBarCode(dto.barcode);

    if (existProduct) {
      throw new ConflictException('Product with this Bar code already exists');
    }

    return this.scanModel.create({ ...dto, userId });
  }

  findProduct(barcode: string) {
    return this.findByBarCode(barcode);
  }
}
