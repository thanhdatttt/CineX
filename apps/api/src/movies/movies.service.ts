import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicationStatus, ShowtimeStatus } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
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
  releaseDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

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
