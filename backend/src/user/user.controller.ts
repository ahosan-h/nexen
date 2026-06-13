import { Controller, Get, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import type { AuthRequest } from 'src/auth/interface/auth-request.interface';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  create(@Req() req: AuthRequest) {
    return this.userService.createUser({
      clerkId: req.user.clerkId,
      email: req.user.email,
    });
  }

  @Get('me')
  profile(@Req() req: AuthRequest) {
    return this.userService.getUserProfile(req.user.clerkId);
  }
}
