import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import type { AuthRequest } from 'src/auth/interface/auth-request.interface';
import { createUserDto } from './dto/create-user.dot';
import { ClerkAuthGuard } from 'src/auth/guard/auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @UseGuards(ClerkAuthGuard)
  create(@Req() req: AuthRequest, @Body() body: createUserDto) {
    return this.userService.createUser({
      clerkId: req.user.clerkId,
      email: body.email,
      username: body.username,
    });
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  profile(@Req() req: AuthRequest) {
    return this.userService.getUserProfile(req.user.clerkId);
  }
}
