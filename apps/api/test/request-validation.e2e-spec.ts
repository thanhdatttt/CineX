import type { ExecutionContext } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { CinemasService } from '../src/cinemas/cinemas.service';
import { ApiError } from '../src/common/api-error';
import { configureHttp } from '../src/common/configure-http';
import { PrismaService } from '../src/database/prisma.service';
import { MoviesService } from '../src/movies/movies.service';
import { UsersService } from '../src/users/users.service';

const id = '63b316d3-b197-44ed-a149-caac26a23cc4';
const calls = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  getProfile: jest.fn(),
  listPublic: jest.fn(),
  getPublic: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  setStatus: jest.fn(),
  searchTmdb: jest.fn(),
  getTmdbCandidate: jest.fn(),
  importTmdbMovie: jest.fn(),
};

describe('Request validation (HTTP)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET ??=
      'e2e-test-secret-with-more-than-thirty-two-bytes';
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(AuthService)
      .useValue(calls)
      .overrideProvider(UsersService)
      .useValue(calls)
      .overrideProvider(MoviesService)
      .useValue(calls)
      .overrideProvider(CinemasService)
      .useValue(calls)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest<Request>().user = {
            id,
            email: 'admin@example.com',
            role: 'ADMIN',
          };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureHttp(app);
    await app.init();
  });

  beforeEach(() => jest.resetAllMocks());
  afterAll(async () => app?.close());

  it.each([
    '/health?unknown=1',
    '/auth/me?unknown=1',
    '/users/admin/identity-check?unknown=1',
    '/users/invalid-id',
    '/movies/invalid-id',
    '/movies/%FF',
    '/cinemas/invalid-id',
    `/movies/${id}?page=1`,
    '/movies?filter=draft',
    '/movies?page=0',
    '/movies?page=1e2',
    '/movies?page=0x10',
    '/movies?page=1&page=2',
    '/movies?page%5B%5D=1',
    '/movies?page=21474838',
    '/movies?limit=101',
    '/movies?constructor=1',
    '/cinemas?limit=abc',
    '/admin/tmdb/movies',
    '/admin/tmdb/movies?query=%20',
    '/admin/tmdb/movies?query=%FF',
    '/admin/tmdb/movies?query=film&page=501',
    '/admin/tmdb/movies/0',
    '/admin/tmdb/movies/-1',
    '/admin/tmdb/movies/2147483648',
  ])('rejects invalid URL %s before business services', async (url) => {
    expectError(await request(app.getHttpServer()).get(url).expect(400));
    expectNoBusinessCalls();
  });

  const movie = { title: 'Movie', durationMins: 90 };
  it.each([
    ['post', '/auth/register', { email: 'invalid', password: 'short' }],
    [
      'post',
      '/auth/register',
      { email: 'a@example.com', password: 'long-password', role: 'ADMIN' },
    ],
    ['post', '/auth/login', { email: 'a@example.com', password: true }],
    ['post', '/auth/refresh', { refreshToken: 'invalid' }],
    ['post', '/auth/logout', { refreshToken: 123 }],
    ['post', '/admin/movies', { ...movie, durationMins: true }],
    ['post', '/admin/movies', { ...movie, durationMins: '1' }],
    ['post', '/admin/movies', { ...movie, durationMins: null }],
    ['post', '/admin/movies', { ...movie, durationMins: 1001 }],
    ['post', '/admin/movies', { ...movie, releaseDate: '2026-02-30' }],
    [
      'post',
      '/admin/movies',
      { ...movie, releaseDate: '2026-02-01T00:00:00Z' },
    ],
    [
      'post',
      '/admin/movies',
      { ...movie, posterUrl: 'ftp://example.com/poster.jpg' },
    ],
    ['post', '/admin/movies', { ...movie, genres: [42] }],
    ['post', '/admin/movies', { ...movie, genres: null }],
    ['post', '/admin/movies', { ...movie, genres: ['Genre\0'] }],
    ['post', '/admin/movies', { ...movie, synopsis: 'Synopsis\0' }],
    ['post', '/admin/movies?unused=1', movie],
    ['patch', `/admin/movies/${id}`, { title: null }],
    ['patch', `/admin/movies/${id}`, { durationMins: null }],
    ['patch', `/admin/movies/${id}`, { genres: null }],
    ['patch', `/admin/movies/${id}`, []],
    ['post', `/admin/movies/${id}/publish`, { status: 'ARCHIVED' }],
    [
      'post',
      '/admin/cinemas',
      { name: 'Cinema', address: 'Street', timezone: 'Invalid/Zone' },
    ],
    ['patch', `/admin/cinemas/${id}`, { timezone: null }],
    ['patch', `/admin/cinemas/${id}`, { name: ' ' }],
    ['post', `/admin/cinemas/${id}/activate`, { name: 'Cinema' }],
    ['post', '/admin/movies/import-tmdb', { tmdbId: 2147483648 }],
    ['post', '/admin/movies/import-tmdb', { tmdbId: [1] }],
    ['post', '/admin/movies/import-tmdb', { tmdbId: 1, movieId: null }],
  ] as const)('rejects invalid %s %s body %j', async (method, url, body) => {
    expectError(
      await request(app.getHttpServer())[method](url).send(body).expect(400),
    );
    expectNoBusinessCalls();
  });

  it.each([
    'null',
    '"text"',
    '{"title":"MARKER"',
    '{"constructor":1}',
    '{"__proto__":{}}',
  ])('returns a safe error for raw JSON %s', async (body) => {
    expectError(
      await request(app.getHttpServer())
        .patch(`/admin/movies/${id}`)
        .type('json')
        .send(body)
        .expect(400),
    );
    expectNoBusinessCalls();
  });

  it('validates missing bodies, media type and body size', async () => {
    const server = request(app.getHttpServer());
    expectError(await server.post('/auth/login').expect(400));
    expectError(
      await server
        .patch(`/admin/movies/${id}`)
        .type('json')
        .set('Transfer-Encoding', 'chunked')
        .expect(400),
    );
    expectError(
      await server.post('/auth/login').type('text').send('text').expect(415),
      'UNSUPPORTED_MEDIA_TYPE',
    );
    expectError(
      await server
        .post('/auth/login')
        .send({ password: 'x'.repeat(102400) })
        .expect(413),
      'PAYLOAD_TOO_LARGE',
    );
    expectError(
      await server.get('/movies').send({ title: 'unexpected' }).expect(400),
    );
    expectNoBusinessCalls();
  });

  it('passes normalized inputs and intentional nulls to business services', async () => {
    const server = request(app.getHttpServer());
    await server.get('/movies?page=02&filter=comingSoon').expect(200);
    expect(calls.listPublic).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      filter: 'comingSoon',
    });

    await server.get('/admin/tmdb/movies?query=%20CineX%20').expect(200);
    expect(calls.searchTmdb).toHaveBeenCalledWith({ query: 'CineX', page: 1 });

    await server.get('/admin/tmdb/movies/123').expect(200);
    expect(calls.getTmdbCandidate).toHaveBeenCalledWith(123);

    await server
      .patch(`/admin/movies/${id.toUpperCase()}`)
      .send({
        title: '  Movie  ',
        synopsis: null,
        releaseDate: null,
        genres: [],
      })
      .expect(200);
    expect(calls.update).toHaveBeenCalledWith(id, {
      title: 'Movie',
      synopsis: null,
      releaseDate: null,
      genres: [],
    });

    await server
      .post('/auth/register')
      .send({ email: ' alice@example.com ', password: '  long password  ' })
      .expect(201);
    expect(calls.register).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: '  long password  ',
    });
  });

  it('distinguishes a public business error from DTO validation', async () => {
    calls.importTmdbMovie.mockRejectedValueOnce(
      new ApiError(400, 'TMDB_RUNTIME_REQUIRED', 'Supply a CineX movie ID.'),
    );
    const response = await request(app.getHttpServer())
      .post('/admin/movies/import-tmdb')
      .send({ tmdbId: 123 })
      .expect(400);
    expectError(response, 'TMDB_RUNTIME_REQUIRED');
    expect(response.text).toContain('Supply a CineX movie ID.');
  });

  it('does not expose exception messages or stacks', async () => {
    calls.getPublic.mockRejectedValueOnce(
      new Error('internal connection data'),
    );
    const response = await request(app.getHttpServer())
      .get(`/movies/${id}`)
      .expect(500);
    expectError(response, 'INTERNAL_ERROR');
    expect(response.text).not.toContain('internal connection data');
  });
});

function expectNoBusinessCalls() {
  for (const fn of Object.values(calls)) expect(fn).not.toHaveBeenCalled();
}

function expectError(response: request.Response, code = 'VALIDATION_ERROR') {
  const requestId = String(response.headers['x-request-id']);
  expect(requestId).toMatch(/^[\da-f-]{36}$/);
  expect(response.body).toEqual({
    error: { code, message: expect.any(String) as string, requestId },
  });
}
