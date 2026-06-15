import { Module } from '@nestjs/common';
import { ScanService } from './scan.service';
import { ScanController } from './scan.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Scan, ScanSchema } from './schema/scan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Scan.name,
        schema: ScanSchema,
      },
    ]),
  ],

  providers: [ScanService],
  controllers: [ScanController],
})
export class ScanModule {}
