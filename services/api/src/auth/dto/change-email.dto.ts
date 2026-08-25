import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ChangeEmailDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  currentPassword!: string;
}
