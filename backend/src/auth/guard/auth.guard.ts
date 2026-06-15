import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthRequest } from '../interface/auth-request.interface';
import { verifyToken } from '@clerk/backend';
import { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    if (request.method === 'OPTIONS') {
      return true;
    }

    const token = this.extractToken(request);

    try {
      const claims = await verifyToken(token, {
        secretKey: this.configService.getOrThrow<string>('CLERK_SECRET_KEY'),
      });

      request.user = {
        clerkId: claims.sub,
      };
      return true;
    } catch (error) {
      this.logger.warn(
        `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: Request): string {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice(7);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    return token;
  }
}
