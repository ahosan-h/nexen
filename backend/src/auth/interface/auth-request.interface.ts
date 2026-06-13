import type { Request } from 'express';

export interface AuthRequest extends Request {
  user: { clerkId: string; email: string };
}
