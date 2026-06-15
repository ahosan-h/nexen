import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ScanService } from './scan.service';
import { createScanDto } from './dto/create-scan.dto';

@Controller('scan')
export class ScanController {
  constructor(private scanService: ScanService) {}

  @Post()
  create(@Body() dto: createScanDto) {
    return this.scanService.createProduct(dto);
  }

  @Get()
  getProduct(@Param('qrcode') qrcode: string) {
    return this.scanService.findProduct(qrcode);
  }
}
