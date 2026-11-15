import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : '',
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}

export class LoginDto {
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : '',
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  refreshToken!: string;
}
