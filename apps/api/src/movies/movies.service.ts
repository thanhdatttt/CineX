import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublicationStatus, ShowtimeStatus } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import {
  ImportTmdbMovieDto,
  SearchTmdbMoviesQueryDto,
} from '../integrations/tmdb/tmdb.dto';
import { TmdbService } from '../integrations/tmdb/tmdb.service';
import {
  CreateMovieDto,
  ListMoviesQueryDto,
  UpdateMovieDto,
} from './movie.dto';

const movieFields = {
  id: true,
  title: true,
  synopsis: true,
  durationMins: true,
  ageRating: true,
  genres: true,
  trailerUrl: true,
  posterUrl: true,
  backdropUrl: true,
  releaseDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const importedMovieFields = { ...movieFields, tmdbId: true } as const;

@Injectable()
export class MoviesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdb: TmdbService,
  ) {}

  searchTmdb(query: SearchTmdbMoviesQueryDto) {
    return this.tmdb.searchMovies(query.query, query.page);
  }

  getTmdbCandidate(tmdbId: number) {
    return this.tmdb.getMovie(tmdbId);
  }

  async importTmdbMovie(input: ImportTmdbMovieDto) {
    const details = await this.tmdb.getMovie(input.tmdbId);
    if (details.durationMins === null && !input.movieId) {
      throw new BadRequestException(
        'TMDB did not provide a valid runtime. Create the movie manually or edit its runtime before importing.',
      );
    }

    const metadata = {
      tmdbId: details.tmdbId,
      title: details.title,
      ...(details.synopsis !== null ? { synopsis: details.synopsis } : {}),
      ...(details.ageRating !== null ? { ageRating: details.ageRating } : {}),
      ...(details.genres.length > 0 ? { genres: details.genres } : {}),
      ...(details.trailerUrl !== null
        ? { trailerUrl: details.trailerUrl }
        : {}),
      ...(details.releaseDate !== null
        ? { releaseDate: toDate(details.releaseDate) }
        : {}),
      ...(details.posterUrl !== null ? { posterUrl: details.posterUrl } : {}),
      ...(details.backdropUrl !== null
        ? { backdropUrl: details.backdropUrl }
        : {}),
      ...(details.durationMins !== null
        ? { durationMins: details.durationMins }
        : {}),
    };

    if (input.movieId) {
      const current = await this.prisma.movie.findUnique({
        where: { id: input.movieId },
        select: { id: true, tmdbId: true },
      });
      if (!current) throw new NotFoundException('Movie not found.');
      if (current.tmdbId !== null && current.tmdbId !== details.tmdbId) {
        throw new ConflictException(
          'This movie is already linked to a different TMDB record.',
        );
      }
      try {
        const movie = await this.prisma.movie.update({
          where: { id: input.movieId },
          data: metadata,
          select: importedMovieFields,
        });
        return { data: movie, sourceUrl: details.sourceUrl, action: 'updated' };
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ConflictException(
            'This TMDB movie is already linked to another CineX movie.',
          );
        }
        throw error;
      }
    }

    const movie = await this.prisma.movie.upsert({
      where: { tmdbId: details.tmdbId },
      create: {
        ...metadata,
        synopsis: details.synopsis,
        ageRating: details.ageRating,
        genres: details.genres,
        trailerUrl: details.trailerUrl,
        releaseDate: toDate(details.releaseDate),
        posterUrl: details.posterUrl,
        backdropUrl: details.backdropUrl,
        durationMins: details.durationMins!,
        status: PublicationStatus.DRAFT,
      },
      update: metadata,
      select: importedMovieFields,
    });
    return { data: movie, sourceUrl: details.sourceUrl, action: 'synced' };
  }

  async listPublic(query: ListMoviesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const where = {
      status: PublicationStatus.PUBLISHED,
      ...(query.filter === 'nowShowing'
        ? {
            showtimes: {
              some: {
                status: ShowtimeStatus.SCHEDULED,
                endsAt: { gt: new Date() },
              },
            },
          }
        : query.filter === 'comingSoon'
          ? { releaseDate: { gt: today } }
          : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.movie.findMany({
        where,
        select: movieFields,
        orderBy: [{ releaseDate: 'asc' }, { title: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.movie.count({ where }),
    ]);
    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPublic(id: string) {
    const movie = await this.prisma.movie.findFirst({
      where: { id, status: PublicationStatus.PUBLISHED },
      select: movieFields,
    });
    if (!movie) throw new NotFoundException('Movie not found.');
    return { data: movie };
  }

  async create(input: CreateMovieDto) {
    const movie = await this.prisma.movie.create({
      data: { ...input, releaseDate: toDate(input.releaseDate) },
      select: movieFields,
    });
    return { data: movie };
  }

  async update(id: string, input: UpdateMovieDto) {
    await this.requireMovie(id);
    const movie = await this.prisma.movie.update({
      where: { id },
      data: {
        ...input,
        ...(input.releaseDate !== undefined
          ? { releaseDate: toDate(input.releaseDate) }
          : {}),
      },
      select: movieFields,
    });
    return { data: movie };
  }

  async setStatus(id: string, status: PublicationStatus) {
    await this.requireMovie(id);
    const movie = await this.prisma.movie.update({
      where: { id },
      data: { status },
      select: movieFields,
    });
    return { data: movie };
  }

  private async requireMovie(id: string): Promise<void> {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!movie) throw new NotFoundException('Movie not found.');
  }
}

function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined || value === null) return value;
  return new Date(`${value}T00:00:00.000Z`);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
