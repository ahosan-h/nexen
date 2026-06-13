import { Controller, Get, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import type { AuthRequest } from 'src/auth/interface/auth-request.interface';

@Controller('user')
export class UserController {}
