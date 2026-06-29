import { Module } from '@nestjs/common';
import { ExpanddmgController } from './expanddmg.controller';
import { ExpanddmgService } from './expanddmg.service';
import { MongooseModule } from '@nestjs/mongoose';
import { expireModel, expireSchema } from './schema/expire.schema';
import { Scan, ScanSchema } from 'src/scan/schema/scan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: expireModel.name, schema: expireSchema },
      { name: Scan.name, schema: ScanSchema },
    ]),
  ],
  controllers: [ExpanddmgController],
  providers: [ExpanddmgService],
})
export class ExpanddmgModule {}
