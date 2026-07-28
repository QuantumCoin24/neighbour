#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "Building Neighbour™ Build 0004 — Identity and Authentication foundation..."

if [[ ! -f "services/api/package.json" ]]; then
  echo "Error: run this script from the Neighbour repository root."
  exit 1
fi

echo "Installing authentication dependencies..."
pnpm --filter @neighbour/api add @nestjs/jwt argon2
pnpm --filter @neighbour/api add -D @types/jsonwebtoken

echo "Extending environment configuration..."

python3 - <<'PY'
from pathlib import Path

env_file = Path(".env")
example_file = Path(".env.example")

required = {
    "JWT_ACCESS_SECRET": "neighbour_local_access_secret_change_me_32_chars",
    "JWT_REFRESH_SECRET": "neighbour_local_refresh_secret_change_me_32_chars",
    "JWT_ACCESS_TTL_SECONDS": "900",
    "JWT_REFRESH_TTL_SECONDS": "2592000",
}

for path in (env_file, example_file):
    text = path.read_text() if path.exists() else ""
    if text and not text.endswith("\n"):
        text += "\n"

    for key, value in required.items():
        if not any(line.startswith(f"{key}=") for line in text.splitlines()):
            text += f"{key}={value}\n"

    path.write_text(text)
PY

cat > services/api/src/config/environment.ts <<'EOF'
import { registerAs } from '@nestjs/config';

export interface Environment {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  appVersion: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtlSeconds: number;
  jwtRefreshTtlSeconds: number;
}

export const environment = registerAs(
  'app',
  (): Environment => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 4000),
    databaseUrl: process.env.DATABASE_URL ?? '',
    appVersion: process.env.APP_VERSION ?? '1.0.0-alpha.4',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    jwtAccessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
    jwtRefreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2_592_000),
  }),
);
EOF

cat > services/api/src/config/environment.validation.ts <<'EOF'
import Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  APP_VERSION: Joi.string().default('1.0.0-alpha.4'),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL_SECONDS: Joi.number().integer().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: Joi.number().integer().positive().default(2_592_000),
});
EOF

echo "Extending Prisma identity schema..."

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/prisma/schema.prisma")
text = path.read_text()

if "enum PlatformRole" not in text:
    marker = "enum UserStatus {\n"
    block = """enum PlatformRole {
  USER
  BUSINESS
  MODERATOR
  ADMIN
  SUPER_ADMIN
}

"""
    text = text.replace(marker, block + marker, 1)

old_user = """model User {
  id          String       @id @default(uuid()) @db.Uuid
  email       String       @unique
  displayName String
  status      UserStatus   @default(ACTIVE)
  memberships Membership[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([status])
  @@map("users")
}"""

new_user = """model User {
  id              String         @id @default(uuid()) @db.Uuid
  email           String         @unique
  displayName     String
  passwordHash    String
  role            PlatformRole   @default(USER)
  status          UserStatus     @default(ACTIVE)
  emailVerifiedAt DateTime?
  memberships     Membership[]
  refreshTokens   RefreshToken[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([status])
  @@index([role])
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  tokenHash String   @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
  @@index([expiresAt])
  @@map("refresh_tokens")
}"""

if old_user in text:
    text = text.replace(old_user, new_user, 1)
elif "passwordHash" not in text or "model RefreshToken" not in text:
    raise SystemExit("Could not safely update the User model. Inspect schema.prisma before retrying.")

path.write_text(text)
PY

mkdir -p \
  services/api/src/auth/dto \
  services/api/src/auth/decorators \
  services/api/src/auth/guards \
  services/api/src/auth/interfaces \
  services/api/src/auth/types

cat > services/api/src/auth/interfaces/auth-user.interface.ts <<'EOF'
import type { PlatformRole, UserStatus } from '../../generated/prisma/enums.js';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: PlatformRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
EOF

cat > services/api/src/auth/interfaces/token-payload.interface.ts <<'EOF'
import type { PlatformRole } from '../../generated/prisma/enums.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: PlatformRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}
EOF

cat > services/api/src/auth/types/authenticated-request.type.ts <<'EOF'
import type { Request } from 'express';

import type { AuthUser } from '../interfaces/auth-user.interface';

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};
EOF

cat > services/api/src/auth/dto/register.dto.ts <<'EOF'
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 80)
  displayName!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/[a-z]/, { message: 'password must contain a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain a number' })
  password!: string;
}
EOF

cat > services/api/src/auth/dto/login.dto.ts <<'EOF'
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
EOF

cat > services/api/src/auth/dto/refresh-token.dto.ts <<'EOF'
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}
EOF

cat > services/api/src/auth/decorators/public.decorator.ts <<'EOF'
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
EOF

cat > services/api/src/auth/decorators/roles.decorator.ts <<'EOF'
import { SetMetadata } from '@nestjs/common';

import type { PlatformRole } from '../../generated/prisma/enums.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: PlatformRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
EOF

cat > services/api/src/auth/decorators/current-user.decorator.ts <<'EOF'
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from '../types/authenticated-request.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
EOF

cat > services/api/src/auth/auth.service.ts <<'EOF'
import { createHash, randomUUID } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import type { Environment } from '../config/environment';
import { DatabaseService } from '../database/database.service';
import { UserStatus } from '../generated/prisma/enums.js';
import type { User } from '../generated/prisma/models/User.js';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from './interfaces/token-payload.interface';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthResponse extends AuthTokens {
  user: ReturnType<AuthService['toPublicUser']>;
}

@Injectable()
export class AuthService {
  private readonly config: Environment;

  constructor(
    private readonly database: DatabaseService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.config = configService.getOrThrow<Environment>('app');
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.database.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = await this.database.user.create({
      data: {
        email: dto.email,
        displayName: dto.displayName,
        passwordHash,
      },
    });

    const tokens = await this.issueTokenPair(user);
    return { user: this.toPublicUser(user), ...tokens };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.database.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active.');
    }

    const tokens = await this.issueTokenPair(user);
    return { user: this.toPublicUser(user), ...tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.database.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date() ||
      storedToken.userId !== payload.sub ||
      storedToken.id !== payload.jti ||
      storedToken.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    await this.database.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(storedToken.user);
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    const tokenHash = this.hashToken(refreshToken);

    await this.database.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { success: true };
  }

  async findAuthenticatedUser(userId: string) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Authentication is no longer valid.');
    }

    return this.toPublicUser(user);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.jwtAccessSecret,
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid access token.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  private async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.jwtRefreshSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  private async issueTokenPair(user: User): Promise<AuthTokens> {
    const refreshTokenId = randomUUID();

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: refreshTokenId,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.config.jwtAccessSecret,
        expiresIn: this.config.jwtAccessTtlSeconds,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.config.jwtRefreshSecret,
        expiresIn: this.config.jwtRefreshTtlSeconds,
      }),
    ]);

    await this.database.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.config.jwtRefreshTtlSeconds * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.jwtAccessTtlSeconds,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
EOF

cat > services/api/src/auth/guards/access-token.guard.ts <<'EOF'
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../auth.service';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
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
EOF

cat > services/api/src/auth/guards/roles.guard.ts <<'EOF'
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { PlatformRole } from '../../generated/prisma/enums.js';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permittedRoles = this.reflector.getAllAndOverride<PlatformRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permittedRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user || !permittedRoles.includes(request.user.role)) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    return true;
  }
}
EOF

cat > services/api/src/auth/auth.controller.ts <<'EOF'
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthUser } from './interfaces/auth-user.interface';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
EOF

cat > services/api/src/auth/auth.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
EOF

echo "Registering AuthModule and preserving public health endpoints..."

python3 - <<'PY'
from pathlib import Path

app_module = Path("services/api/src/app.module.ts")
text = app_module.read_text()

if "import { AuthModule }" not in text:
    marker = "import { environment } from './config/environment';"
    text = text.replace(marker, "import { AuthModule } from './auth/auth.module';\n" + marker)

if "    AuthModule," not in text:
    marker = "    DatabaseModule,"
    text = text.replace(marker, "    AuthModule,\n" + marker)

app_module.write_text(text)

for filename in [
    "services/api/src/health/health.controller.ts",
    "services/api/src/database/database-health.controller.ts",
]:
    path = Path(filename)
    source = path.read_text()

    if "Public" not in source:
        imports = source.splitlines()
        insert_at = 0
        while insert_at < len(imports) and imports[insert_at].startswith("import"):
            insert_at += 1
        imports.insert(insert_at, "import { Public } from '../auth/decorators/public.decorator';")
        source = "\n".join(imports) + ("\n" if path.read_text().endswith("\n") else "")

    if "@Public()" not in source:
        source = source.replace("@Controller(", "@Public()\n@Controller(", 1)

    path.write_text(source)
PY

cat > services/api/test/auth.dto.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterDto } from '../src/auth/dto/register.dto';

describe('RegisterDto', () => {
  it('normalises a valid registration request', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: '  Person@Example.com ',
      displayName: '  Neighbour User  ',
      password: 'StrongPassword123',
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.email, 'person@example.com');
    assert.equal(dto.displayName, 'Neighbour User');
  });

  it('rejects a weak password', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'person@example.com',
      displayName: 'Neighbour User',
      password: 'password',
    });

    const errors = await validate(dto);

    assert.ok(errors.some((error) => error.property === 'password'));
  });
});
EOF

cat > docs/architecture/0004-identity-authentication.md <<'EOF'
# Build 0004 — Identity and Authentication Foundation

Build 0004 establishes Neighbour™ platform identity and API authentication.

## Capabilities

- Email and password registration
- Argon2id password hashing
- Login with generic credential failure responses
- Short-lived JWT access tokens
- Rotating, server-recorded refresh tokens
- SHA-256 refresh-token storage
- Refresh-token revocation and logout
- Protected `/api/v1/auth/me` endpoint
- Platform roles and reusable role guard
- User account status enforcement
- Email-verification data field reserved for the later mail-delivery build

## Security model

Passwords are never stored directly. Refresh tokens are returned to the client once and persisted only as hashes. Each successful refresh revokes the previous refresh token and issues a new token pair. Access tokens and refresh tokens use independent signing secrets.

## Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

The health endpoints remain public.
EOF

echo "Generating Prisma client..."
pnpm --filter @neighbour/api db:generate

echo "Formatting and validating Build 0004..."
pnpm format
pnpm check

if command -v docker >/dev/null 2>&1 && docker compose ps postgres --status running >/dev/null 2>&1; then
  echo "Applying Build 0004 database migration..."
  pnpm --filter @neighbour/api exec prisma migrate dev --name identity_authentication
else
  echo "PostgreSQL is not running. Start it and apply the migration with:"
  echo "  docker compose up -d postgres"
  echo "  pnpm --filter @neighbour/api exec prisma migrate dev --name identity_authentication"
fi

echo
echo "Neighbour™ Build 0004 foundation created successfully."
echo
echo "Next:"
echo "  pnpm --filter @neighbour/api dev"
echo
echo "Register:"
echo "  curl -X POST http://localhost:4000/api/v1/auth/register \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"owner@neighbour.local\",\"displayName\":\"Neighbour Owner\",\"password\":\"StrongPassword123\"}'"
