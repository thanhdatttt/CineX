import { ServiceUnavailableException } from '@nestjs/common';
import { TmdbService } from './tmdb.service';

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
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-only',
        }),
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
