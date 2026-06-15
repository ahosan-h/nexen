import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import type { AuthRequest } from 'src/auth/interface/auth-request.interface';
import { createUserDto } from './dto/create-user.dot';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  create(@Req() req: AuthRequest, @Body() body: createUserDto) {
    return this.userService.createUser({
      clerkId: req.user.clerkId,
      email: body.email,
    });
  }

  @Get('me')
  profile(@Req() req: AuthRequest) {
    return this.userService.getUserProfile(req.user.clerkId);
  }
}
