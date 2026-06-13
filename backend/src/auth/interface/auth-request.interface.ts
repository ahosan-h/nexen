import type { Request } from 'express';

export interface AuthRequest extends Request {
  clerkId: string;
  email: string;
}
