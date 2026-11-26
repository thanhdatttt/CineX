import {
  IsText,
  OptionalField,
  PaginationQueryDto,
  Trim,
} from '../common/request-validation';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUrl,
  IsDateString,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMovieDto {
  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsText()
  @MaxLength(10000)
  synopsis?: string | null;

  @IsInt()
  @Min(1)
  @Max(1000)
  durationMins!: number;

  @IsOptional()
  @IsText()
  @MaxLength(20)
  ageRating?: string | null;

  @OptionalField()
  @IsArray()
  @ArrayMaxSize(20)
  @IsText({ each: true })
  @MaxLength(50, { each: true })
  genres?: string[];

  @IsOptional()
  @IsText()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  trailerUrl?: string | null;

  @IsOptional()
  @IsText()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  posterUrl?: string | null;

  @IsOptional()
  @IsText()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  backdropUrl?: string | null;

  @IsOptional()
  @IsText()
  @MinLength(10)
  @MaxLength(10)
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  releaseDate?: string | null;
}

export class UpdateMovieDto {
  @OptionalField()
  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsText()
  @MaxLength(10000)
  synopsis?: string | null;

  @OptionalField()
  @IsInt()
  @Min(1)
  @Max(1000)
  durationMins?: number;

  @IsOptional()
  @IsText()
  @MaxLength(20)
  ageRating?: string | null;

  @OptionalField()
  @IsArray()
  @ArrayMaxSize(20)
  @IsText({ each: true })
  @MaxLength(50, { each: true })
  genres?: string[];

  @IsOptional()
  @IsText()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  trailerUrl?: string | null;

  @IsOptional()
  @IsText()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  posterUrl?: string | null;

  @IsOptional()
  @IsText()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  backdropUrl?: string | null;

  @IsOptional()
  @IsText()
  @MinLength(10)
  @MaxLength(10)
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  releaseDate?: string | null;
}

export class ListMoviesQueryDto extends PaginationQueryDto {
  @OptionalField()
  @IsEnum({ nowShowing: 'nowShowing', comingSoon: 'comingSoon' })
  filter?: 'nowShowing' | 'comingSoon';
}
