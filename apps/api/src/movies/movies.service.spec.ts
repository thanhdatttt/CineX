/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { NotFoundException } from '@nestjs/common';
import { PublicationStatus, ShowtimeStatus } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { MoviesService } from './movies.service';

describe('MoviesService', () => {
  const prisma = {
    movie: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const tmdb = { searchMovies: jest.fn(), getMovie: jest.fn() };
  const service = new MoviesService(
    prisma as unknown as PrismaService,
    tmdb as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );
    prisma.movie.findMany.mockResolvedValue([]);
    prisma.movie.count.mockResolvedValue(0);
    tmdb.getMovie.mockResolvedValue({
      tmdbId: 123,
      title: 'TMDB Movie',
      synopsis: 'Synopsis',
      durationMins: 110,
      ageRating: '13+',
      genres: ['Drama'],
      trailerUrl: 'https://www.youtube.com/watch?v=abc',
      releaseDate: '2026-01-02',
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      backdropUrl: null,
      sourceUrl: 'https://www.themoviedb.org/movie/123',
    });
  });

  it('only lists published movies with stable order and bounded pagination', async () => {
    await service.listPublic({ page: 2, limit: 10 });
    expect(prisma.movie.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: PublicationStatus.PUBLISHED },
        orderBy: [{ releaseDate: 'asc' }, { title: 'asc' }, { id: 'asc' }],
        skip: 10,
        take: 10,
      }),
    );
  });

  it('filters now showing by schedule and coming soon by release date', async () => {
    for (const filter of ['nowShowing', 'comingSoon'] as const) {
      await service.listPublic({ filter, page: 1, limit: 20 });
      const where = prisma.movie.findMany.mock.calls.at(-1)![0].where as {
        status: PublicationStatus;
        releaseDate?: { gt: Date };
        showtimes?: {
          some: { status: ShowtimeStatus; endsAt: { gt: Date } };
        };
      };
      expect(where.status).toBe(PublicationStatus.PUBLISHED);
      if (filter === 'nowShowing') {
        expect(where.showtimes?.some.status).toBe(ShowtimeStatus.SCHEDULED);
        expect(where.showtimes?.some.endsAt.gt).toBeInstanceOf(Date);
      } else {
        expect(where.releaseDate?.gt).toBeInstanceOf(Date);
      }
    }
  });

  it('hides unpublished movie details as not found', async () => {
    prisma.movie.findFirst.mockResolvedValue(null);
    await expect(service.getPublic('movie-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.movie.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'movie-id', status: PublicationStatus.PUBLISHED },
      }),
    );
  });

  it('persists a CineX movie as draft and changes publication state explicitly', async () => {
    prisma.movie.create.mockResolvedValue({
      id: 'movie-id',
      status: PublicationStatus.DRAFT,
    });
    prisma.movie.findUnique.mockResolvedValue({ id: 'movie-id' });
    prisma.movie.update.mockResolvedValue({
      id: 'movie-id',
      status: PublicationStatus.PUBLISHED,
    });
    const created = (await service.create({
      title: 'Imported locally',
      durationMins: 100,
    })) as { data: { status: PublicationStatus } };
    await service.setStatus('movie-id', PublicationStatus.PUBLISHED);

    expect(prisma.movie.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'Imported locally' }),
      }),
    );
    expect(created.data.status).toBe(PublicationStatus.DRAFT);
    expect(prisma.movie.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'movie-id' },
        data: { status: PublicationStatus.PUBLISHED },
      }),
    );
  });

  it('rejects updates to unknown movies', async () => {
    prisma.movie.findUnique.mockResolvedValue(null);
    await expect(
      service.update('missing-id', { title: 'New title' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('imports TMDB metadata into an unpublished CineX-owned movie', async () => {
    prisma.movie.upsert.mockResolvedValue({ id: 'new-movie', tmdbId: 123 });
    await service.importTmdbMovie({ tmdbId: 123 });
    expect(prisma.movie.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tmdbId: 123 },
        create: expect.objectContaining({
          tmdbId: 123,
          title: 'TMDB Movie',
          durationMins: 110,
          status: PublicationStatus.DRAFT,
        }),
        update: expect.objectContaining({
          title: 'TMDB Movie',
          posterUrl: expect.any(String),
        }),
      }),
    );
  });

  it('syncs an explicit CineX movie without changing its publication state', async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: 'movie-id', tmdbId: 123 });
    prisma.movie.update.mockResolvedValue({ id: 'movie-id', tmdbId: 123 });
    await service.importTmdbMovie({ tmdbId: 123, movieId: 'movie-id' });
    expect(prisma.movie.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'movie-id' },
        data: expect.objectContaining({ title: 'TMDB Movie', tmdbId: 123 }),
        select: expect.objectContaining({ status: true }),
      }),
    );
    expect(prisma.movie.update.mock.calls[0][0].data).not.toHaveProperty(
      'status',
    );
  });

  it('rejects relinking an already linked CineX movie to a different TMDB record', async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: 'movie-id', tmdbId: 456 });
    await expect(
      service.importTmdbMovie({ tmdbId: 123, movieId: 'movie-id' }),
    ).rejects.toThrow('already linked to a different TMDB record');
    expect(prisma.movie.update).not.toHaveBeenCalled();
  });
});
