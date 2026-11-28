import { IsTimeZone, MaxLength, MinLength } from 'class-validator';
import { IsText, OptionalField, Trim } from '../common/request-validation';

export class CreateCinemaDto {
  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(500)
  address!: string;

  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(100)
  @IsTimeZone()
  timezone!: string;
}

export class UpdateCinemaDto {
  @OptionalField()
  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @OptionalField()
  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(500)
  address?: string;

  @OptionalField()
  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(100)
  @IsTimeZone()
  timezone?: string;
}
