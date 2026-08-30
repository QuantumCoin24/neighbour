import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import type { DeviceRegistration } from './device-registration.interface';
import { DeviceRegistryService } from './device-registry.service';
import { RegisterDeviceDto } from './register-device.dto';

@Controller('notifications/devices')
export class DeviceController {
  constructor(private readonly devices: DeviceRegistryService) {}

  @Post()
  register(
    @CurrentUser() user: AuthUser,
    @Body() input: RegisterDeviceDto,
  ): Promise<DeviceRegistration> {
    return this.devices.register(user.id, input);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':token')
  async unregister(
    @CurrentUser() user: AuthUser,
    @Param('token') token: string,
  ): Promise<void> {
    await this.devices.unregister(user.id, token);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async unregisterAll(@CurrentUser() user: AuthUser): Promise<void> {
    await this.devices.unregisterAll(user.id);
  }
}
