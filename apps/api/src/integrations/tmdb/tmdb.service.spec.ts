import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { MAX_TMDB_ID } from './tmdb.types';

describe('TmdbService', () => {
  const service = new TmdbService();
  const originalToken = process.env.TMDB_API_READ_ACCESS_TOKEN;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalToken === undefined)
      delete process.env.TMDB_API_READ_ACCESS_TOKEN;
    else process.env.TMDB_API_READ_ACCESS_TOKEN = originalToken;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('keeps TMDB optional and gives a safe error when its token is absent', async () => {
    delete process.env.TMDB_API_READ_ACCESS_TOKEN;
    await expect(service.searchMovies('Dune', 1)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('uses the server-side bearer token and normalizes TMDB movie details', async () => {
    process.env.TMDB_API_READ_ACCESS_TOKEN = 'test-token-only';
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 42,
          title: 'Sample Film',
          overview: 'A story.',
          runtime: 120,
          release_date: '2026-01-02',
          poster_path: '/poster.jpg',
          backdrop_path: '/backdrop.jpg',
          genres: [{ name: 'Drama' }],
          release_dates: {
            results: [
              { iso_3166_1: 'VN', release_dates: [{ certification: 'T13' }] },
            ],
          },
          videos: {
            results: [
              {
                site: 'YouTube',
                type: 'Trailer',
                official: true,
                key: 'trailer-key',
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    global.fetch = fetchMock;

    const result = await service.getMovie(42);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/movie/42?'),
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer test-token-only',
          Accept: 'application/json',
        },
      }),
    );
    expect(result).toMatchObject({
      tmdbId: 42,
      title: 'Sample Film',
      durationMins: 120,
      ageRating: 'T13',
      genres: ['Drama'],
      trailerUrl: 'https://www.youtube.com/watch?v=trailer-key',
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      sourceUrl: 'https://www.themoviedb.org/movie/42',
    });
  });

  it('returns only candidates with an importable ID and valid title', async () => {
    process.env.TMDB_API_READ_ACCESS_TOKEN = 'test-token-only';
    global.fetch = jest.fn().mockResolvedValue(
      Response.json({
        results: [
          { id: MAX_TMDB_ID, title: ' Candidate ', overview: 'Bad\0overview' },
          { id: MAX_TMDB_ID + 1, title: 'ID too large' },
          { id: 0, title: 'ID too small' },
          { id: 1.5, title: 'Fractional ID' },
          { id: 41, title: 'Bad\0title' },
        ],
      }),
    );

    const result = await service.searchMovies('Film', 1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      tmdbId: MAX_TMDB_ID,
      title: 'Candidate',
      synopsis: null,
    });
  });

  it('rejects an out-of-range detail ID before making a network request', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;
    await expect(service.getMovie(MAX_TMDB_ID + 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a detail payload with a NUL character in its required title', async () => {
    process.env.TMDB_API_READ_ACCESS_TOKEN = 'test-token-only';
    global.fetch = jest
      .fn()
      .mockResolvedValue(Response.json({ id: 42, title: 'Bad\0title' }));
    await expect(service.getMovie(42)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('drops optional TMDB text containing NUL characters', async () => {
    process.env.TMDB_API_READ_ACCESS_TOKEN = 'test-token-only';
    global.fetch = jest.fn().mockResolvedValue(
      Response.json({
        id: 42,
        title: 'Film',
        overview: 'Bad\0overview',
        genres: [{ name: 'Bad\0genre' }, { name: 'Drama' }],
        release_dates: {
          results: [
            {
              iso_3166_1: 'VN',
              release_dates: [{ certification: 'Bad\0rating' }],
            },
          ],
        },
      }),
    );
    await expect(service.getMovie(42)).resolves.toMatchObject({
      synopsis: null,
      ageRating: null,
      genres: ['Drama'],
    });
  });

  it('does not leak upstream response details when TMDB fails', async () => {
    process.env.TMDB_API_READ_ACCESS_TOKEN = 'test-token-only';
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response('private upstream detail', { status: 500 }),
      );
    await expect(service.searchMovies('Dune', 1)).rejects.toThrow(
      'TMDB is unavailable. Try again later.',
    );
  });
});
