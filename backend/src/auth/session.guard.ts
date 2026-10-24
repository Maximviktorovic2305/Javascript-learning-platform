import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SESSION_COOKIE } from './auth.types';
import type { AuthenticatedRequest } from './auth.types';
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    req.user = await this.auth.authenticate(
      (req.cookies as Record<string, unknown> | undefined)?.[SESSION_COOKIE],
    );
    return true;
  }
}
