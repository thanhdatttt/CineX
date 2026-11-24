import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsDateString,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateMovieDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  synopsis?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  durationMins!: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ageRating?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  genres?: string[];

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  trailerUrl?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  posterUrl?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  backdropUrl?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  releaseDate?: string | null;
}

export class UpdateMovieDto {
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  synopsis?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  durationMins?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ageRating?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  genres?: string[];

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  trailerUrl?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  posterUrl?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  backdropUrl?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  releaseDate?: string | null;
}

export class ListMoviesQueryDto {
  @IsOptional()
  @IsEnum({ nowShowing: 'nowShowing', comingSoon: 'comingSoon' })
  filter?: 'nowShowing' | 'comingSoon';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
