import { IsInt, Max, MaxLength, Min, MinLength } from 'class-validator';
import {
  DecimalInteger,
  IsText,
  OptionalField,
  Trim,
  Uuid,
} from '../../common/request-validation';

const MAX_TMDB_ID = 2_147_483_647;

export class SearchTmdbMoviesQueryDto {
  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(100)
  query!: string;

  @DecimalInteger()
  @IsInt()
  @Min(1)
  @Max(500)
  page = 1;
}

export class TmdbMovieParamsDto {
  @DecimalInteger()
  @IsInt()
  @Min(1)
  @Max(MAX_TMDB_ID)
  tmdbId!: number;
}

export class ImportTmdbMovieDto {
  @IsInt()
  @Min(1)
  @Max(MAX_TMDB_ID)
  tmdbId!: number;

  @OptionalField()
  @Uuid()
  movieId?: string;
}
