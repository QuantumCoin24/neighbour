import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @IsString()
  @MinLength(12)
  @Matches(/[a-z]/, {
    message: 'password must contain a lowercase letter',
  })
  @Matches(/[A-Z]/, {
    message: 'password must contain an uppercase letter',
  })
  @Matches(/[0-9]/, {
    message: 'password must contain a number',
  })
  newPassword!: string;
}
