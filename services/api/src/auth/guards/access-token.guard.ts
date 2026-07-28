import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,

    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer access token is required.');
    }

    const token = authorization.slice('Bearer '.length).trim();
    const payload = await this.authService.verifyAccessToken(token);

    request.user = await this.authService.findAuthenticatedUser(payload.sub);

    return true;
  }
}
