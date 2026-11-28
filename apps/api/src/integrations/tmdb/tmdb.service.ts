import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MAX_TMDB_ID } from './tmdb.types';
import type { TmdbMovieCandidate, TmdbMovieMetadata } from './tmdb.types';

const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMAGES = 'https://image.tmdb.org/t/p';

@Injectable()
export class TmdbService {
  async searchMovies(query: string, page: number) {
    const search = new URLSearchParams({
      query,
      page: String(page),
      language: 'vi-VN',
      include_adult: 'false',
    });
    const result = await this.get(`/search/movie?${search}`);
    if (!isRecord(result) || !Array.isArray(result.results)) {
      throw unavailable();
    }
    const candidates = result.results.flatMap((movie): TmdbMovieCandidate[] => {
      if (!isRecord(movie) || !isTmdbId(movie.id)) return [];
      const title = nullableString(movie.title);
      if (!title) return [];
      return [
        {
          tmdbId: movie.id,
          title: title.slice(0, 200),
          synopsis: nullableString(movie.overview)?.slice(0, 10000) ?? null,
          releaseDate: validDate(movie.release_date),
          posterUrl: imageUrl(movie.poster_path, 'w500'),
          backdropUrl: imageUrl(movie.backdrop_path, 'w1280'),
          sourceUrl: tmdbMovieUrl(movie.id),
        },
      ];
    });
    return {
      data: candidates,
      meta: {
        page: numberOr(result.page, page),
        totalPages: numberOr(result.total_pages, 0),
        totalResults: numberOr(result.total_results, 0),
      },
    };
  }

  async getMovie(tmdbId: number): Promise<TmdbMovieMetadata> {
    if (!isTmdbId(tmdbId)) {
      throw new NotFoundException('TMDB movie not found.');
    }
    const result = await this.get(
      `/movie/${tmdbId}?${new URLSearchParams({
        language: 'vi-VN',
        append_to_response: 'release_dates,videos',
      })}`,
    );
    if (!isRecord(result) || result.id !== tmdbId) throw unavailable();
    const title = nullableString(result.title);
    if (!title) throw unavailable();
    return {
      tmdbId,
      title: title.slice(0, 200),
      synopsis: nullableString(result.overview)?.slice(0, 10000) ?? null,
      durationMins: positiveIntegerOrNull(result.runtime),
      ageRating: certification(result.release_dates),
      genres: genreNames(result.genres),
      trailerUrl: trailerUrl(result.videos),
      releaseDate: validDate(result.release_date),
      posterUrl: imageUrl(result.poster_path, 'w500'),
      backdropUrl: imageUrl(result.backdrop_path, 'w1280'),
      sourceUrl: tmdbMovieUrl(tmdbId),
    };
  }

  private async get(path: string): Promise<unknown> {
    const token = process.env.TMDB_API_READ_ACCESS_TOKEN?.trim();
    if (!token) {
      throw new ServiceUnavailableException(
        'TMDB integration is not configured. Set TMDB_API_READ_ACCESS_TOKEN on the API server.',
      );
    }

    let response: Response;
    try {
      response = await fetch(`${TMDB_API}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw unavailable();
    }
    if (response.status === 404)
      throw new NotFoundException('TMDB movie not found.');
    if (!response.ok) throw unavailable();
    try {
      return await response.json();
    } catch {
      throw unavailable();
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTmdbId(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_TMDB_ID
  );
}

function nullableString(value: unknown): string | null {
  if (typeof value !== 'string' || value.includes('\0')) return null;
  return value.trim() || null;
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function positiveIntegerOrNull(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= 1000
    ? value
    : null;
}

function validDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : null;
}

function imageUrl(path: unknown, size: 'w500' | 'w1280'): string | null {
  return typeof path === 'string' &&
    /^\/[A-Za-z0-9_./-]+$/.test(path) &&
    !path.includes('..')
    ? `${TMDB_IMAGES}/${size}${path}`
    : null;
}

function tmdbMovieUrl(id: number): string {
  return `https://www.themoviedb.org/movie/${id}`;
}

function genreNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((genre) => nullableString(genre.name))
    .filter((name): name is string => name !== null)
    .map((name) => name.slice(0, 50))
    .slice(0, 20);
}

function certification(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value.results)) {
    return null;
  }
  const countries = value.results.filter(isRecord);
  const vietnam = countries.find((country) => country.iso_3166_1 === 'VN');
  const selected =
    vietnam ?? countries.find((country) => country.iso_3166_1 === 'US');
  if (!selected || !Array.isArray(selected.release_dates)) return null;
  for (const release of selected.release_dates.filter(isRecord)) {
    const found = nullableString(release.certification);
    if (found) return found.slice(0, 20);
  }
  return null;
}

function trailerUrl(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value.results)) return null;
  const videos = value.results.filter(isRecord);
  const selected =
    videos.find(
      (video) =>
        video.site === 'YouTube' &&
        video.type === 'Trailer' &&
        video.official === true,
    ) ??
    videos.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer',
    );
  const key = selected ? nullableString(selected.key) : null;
  return key
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(key)}`
    : null;
}

function unavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException(
    'TMDB is unavailable. Try again later.',
  );
}
