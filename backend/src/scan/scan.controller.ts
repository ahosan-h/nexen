import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ScanService } from './scan.service';
import { createScanDto } from './dto/create-scan.dto';
import type { AuthRequest } from 'src/auth/interface/auth-request.interface';
import { ClerkAuthGuard } from 'src/auth/guard/auth.guard';

@Controller('scan')
export class ScanController {
  constructor(private scanService: ScanService) {}
  @Get('products')
  @UseGuards(ClerkAuthGuard)
  getallproduct() {
    return this.scanService.getallproduct();
  }
  @Post()
  @UseGuards(ClerkAuthGuard)
  create(@Body() dto: createScanDto, @Req() req: AuthRequest) {
    return this.scanService.createProduct(req.user.clerkId, dto);
  }

  @Get(':barcode')
  @UseGuards(ClerkAuthGuard)
  getProduct(@Param('barcode') barcode: string) {
    return this.scanService.findProduct(barcode);
  }
}
