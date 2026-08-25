import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';

import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthUser } from './interfaces/auth-user.interface';
import type { AuthResponse, AuthTokens } from './interfaces/auth-response.interface';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Body() dto: RefreshTokenDto): Promise<{ success: true }> {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @Patch('email')
  changeEmail(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangeEmailDto,
  ): Promise<{ success: true }> {
    return this.authService.changeEmail(user.id, dto);
  }

  @Patch('password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    return this.authService.changePassword(user.id, dto);
  }

  @Delete('account')
  deleteAccount(@CurrentUser() user: AuthUser): Promise<{ success: true }> {
    return this.authService.deleteAccount(user.id);
  }
}
