/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureHttp } from './../src/common/configure-http';
import { hashPassword } from './../src/auth/password';

const customerId = '63b316d3-b197-44ed-a149-caac26a23cc4';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let storedUser: Record<string, any> | undefined;
  let refreshRecords: Record<string, any>[] = [];
  const saveRefreshToken = (data: Record<string, any>) => {
    const record = {
      id: `refresh-${refreshRecords.length + 1}`,
      revokedAt: null,
      ...data,
    };
    refreshRecords.push(record);
    return record;
  };
  const prismaMock = {
    refreshToken: { create: jest.fn(({ data }) => saveRefreshToken(data)) },
    $transaction: jest.fn((callback) =>
      callback({
        refreshToken: {
          findUnique: ({ where }) => {
            const record = refreshRecords.find(
              (item) => item.tokenHash === where.tokenHash,
            );
            return record ? { ...record, user: storedUser } : null;
          },
          updateMany: ({ where, data }) => {
            const matches = refreshRecords.filter(
              (item) =>
                (!where.familyId || item.familyId === where.familyId) &&
                item.revokedAt === where.revokedAt &&
                (!where.id || item.id === where.id) &&
                (!where.expiresAt || item.expiresAt > where.expiresAt.gt),
            );
            matches.forEach((item) => Object.assign(item, data));
            return { count: matches.length };
          },
          create: ({ data }) => saveRefreshToken(data),
        },
      }),
    ),
    user: {
      create: jest.fn(({ data }) => {
        const user = {
          id: customerId,
          status: 'ACTIVE',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          ...data,
        };
        storedUser = user;
        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }),
      findUnique: jest.fn(({ where, select }) => {
        if (where.id && where.id !== storedUser?.id) return null;
        if (
          where.normalizedEmail &&
          where.normalizedEmail !== storedUser?.normalizedEmail
        ) {
          return null;
        }
        if (!storedUser) return null;
        if (!select) return storedUser;
        return Object.fromEntries(
          Object.keys(select)
            .filter((key) => select[key])
            .map((key) => [key, storedUser?.[key]]),
        );
      }),
    },
  };

  beforeEach(async () => {
    process.env.JWT_SECRET ??=
      'e2e-test-secret-with-more-than-thirty-two-bytes';
    storedUser = undefined;
    refreshRecords = [];
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    const server = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureHttp(server);
    app = server;
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('registers a customer and rejects client supplied roles', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'alice@example.com',
        password: 'correct horse battery staple',
        role: 'ADMIN',
      })
      .expect(400);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'alice@example.com',
        password: 'correct horse battery staple',
      })
      .expect(201);

    expect(response.body.user).toEqual({
      id: customerId,
      email: 'alice@example.com',
      role: 'CUSTOMER',
    });
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(storedUser?.passwordHash).not.toBe('correct horse battery staple');
  });

  it('authenticates requests and returns 403 for forbidden roles', async () => {
    storedUser = {
      id: customerId,
      email: 'alice@example.com',
      normalizedEmail: 'alice@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      passwordHash: await hashPassword('correct horse battery staple'),
    };

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'correct horse battery staple',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => expect(body.role).toBe('CUSTOMER'));

    await request(app.getHttpServer())
      .get('/users/admin/identity-check')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(403)
      .expect(({ body }) => expect(body.error.code).toBe('FORBIDDEN'));

    await request(app.getHttpServer())
      .get(`/users/${customerId.toUpperCase()}`)
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(customerId);
        expect(body).not.toHaveProperty('passwordHash');
      });

    await request(app.getHttpServer())
      .get('/users/6625f95e-8c33-41ac-a6ce-cbe5770baa54')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(403)
      .expect(({ body }) => expect(body.error.code).toBe('FORBIDDEN'));

    await request(app.getHttpServer())
      .get('/auth/me')
      .set({
        Authorization: [`Bearer ${login.body.accessToken}`, 'Bearer invalid'],
      })
      .expect(401)
      .expect(({ body }) => expect(body.error.code).toBe('UNAUTHENTICATED'));
  });

  it('returns 401 for malformed bearer tokens', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401)
      .expect(({ body }) => expect(body.error.code).toBe('UNAUTHENTICATED'));
  });

  it('rotates refresh tokens and revokes their family on reuse', async () => {
    storedUser = {
      id: customerId,
      email: 'alice@example.com',
      normalizedEmail: 'alice@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      passwordHash: await hashPassword('correct horse battery staple'),
    };
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'correct horse battery staple',
      })
      .expect(200);

    const rotation = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);
    expect(rotation.body.refreshToken).not.toBe(login.body.refreshToken);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: rotation.body.refreshToken })
      .expect(401);
  });

  afterEach(async () => {
    if (app) await app.close();
  });
});
