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

  @Post()
  @UseGuards(ClerkAuthGuard)
  create(@Body() dto: createScanDto, @Req() req: AuthRequest) {
    return this.scanService.createProduct(req.user.clerkId, dto);
  }

  @Get(':qrcode')
  @UseGuards(ClerkAuthGuard)
  getProduct(@Param('qrcode') qrcode: string) {
    return this.scanService.findProduct(qrcode);
  }
}
