import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'password must contain at least 8 characters' })
  @MaxLength(128)
  @Matches(/[A-Za-z]/, {
    message: 'password must contain a letter',
  })
  @Matches(/[0-9]/, {
    message: 'password must contain a number',
  })
  newPassword!: string;
}
