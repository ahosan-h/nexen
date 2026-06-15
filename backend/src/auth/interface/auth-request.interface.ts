import type { Request } from 'express';

export interface AuthUser {
  clerkId: string;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}
