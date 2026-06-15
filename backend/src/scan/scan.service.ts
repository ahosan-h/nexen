import { Scan } from './schema/scan.schema';
import { InjectModel } from '@nestjs/mongoose';
import { ConflictException, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateScanDto } from './dto/create-scan.dto';

@Injectable()
export class ScanService {
  constructor(@InjectModel(Scan.name) private scanModel: Model<Scan>) {}

  async findByQrCode(qrcode: string) {
    return this.scanModel.findOne({ qrcode });
  }

  async createProduct(dto: CreateScanDto) {
    const existProduct = await this.findByQrCode(dto.qrcode);

    if (existProduct) {
      throw new ConflictException('Product with this QR code already exists');
    }

    return this.scanModel.create(dto);
  }

  findProduct(qrcode: string) {
    return this.findByQrCode(qrcode);
  }
}
