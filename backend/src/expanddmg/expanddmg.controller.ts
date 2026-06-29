import { Body, Controller, Post, Req } from '@nestjs/common';
import { ExpanddmgService } from './expanddmg.service';
import { Request } from 'express'; // 1. Import standard Express Request
import type { AuthRequest } from 'src/auth/interface/auth-request.interface'; // 2. Fixed with 'import type'

@Controller('expanddmg')
export class ExpanddmgController {
  constructor(private readonly expanddmgservice: ExpanddmgService) {}

  @Post('expire')
  recordExpire(
    // 3. Type-cast the request explicitly using an intersection type
    @Req() req: Request & AuthRequest,
    @Body() body: { catagory: string; name: string; reportedby: string },
  ) {
    console.log(body);
    return this.expanddmgservice.record_expire(
      body.catagory,
      body.name,
      body.reportedby,
    );
  }
}
