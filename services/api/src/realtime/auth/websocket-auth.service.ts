import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Socket } from 'socket.io';

import { AuthService } from '../../auth/auth.service';
import type { WebSocketAuthenticationResult } from './websocket-auth.interface';

@Injectable()
export class WebSocketAuthService {
  constructor(private readonly authService: AuthService) {}

  async authenticate(client: Socket): Promise<WebSocketAuthenticationResult> {
    const token = this.extractAccessToken(client);

    const payload = await this.authService.verifyAccessToken(token);
    const user = await this.authService.findAuthenticatedUser(payload.sub);

    return {
      token,
      user,
    };
  }

  private extractAccessToken(client: Socket): string {
    const authToken = client.handshake.auth?.token;
    const authorizationHeader = client.handshake.headers.authorization;

    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return this.removeBearerPrefix(authToken);
    }

    if (typeof authorizationHeader === 'string' && authorizationHeader.trim().length > 0) {
      return this.removeBearerPrefix(authorizationHeader);
    }

    throw new UnauthorizedException('A valid WebSocket access token is required.');
  }

  private removeBearerPrefix(value: string): string {
    const token = value
      .trim()
      .replace(/^Bearer\s+/i, '')
      .trim();

    if (!token) {
      throw new UnauthorizedException('A valid WebSocket access token is required.');
    }

    return token;
  }
}
