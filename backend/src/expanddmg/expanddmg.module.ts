import { Module } from '@nestjs/common';
import { ExpanddmgController } from './expanddmg.controller';
import { ExpanddmgService } from './expanddmg.service';

@Module({
  controllers: [ExpanddmgController],
  providers: [ExpanddmgService]
})
export class ExpanddmgModule {}
