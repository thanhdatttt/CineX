import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AUTH_SETTINGS } from '../src/auth/auth.settings';
import { configureHttp } from '../src/common/configure-http';
import { PrismaService } from '../src/database/prisma.service';
import { UserRole } from '../src/generated/prisma/enums';

const databaseUrl = process.env.CINEX_ROOM_TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;
const secret = 'room-layout-e2e-test-secret-more-than-32-bytes';

suite('Room layouts against isolated PostgreSQL', () => {
  let app: NestExpressApplication;
  let db: PrismaService;
  let cinemaId: string;
  let movieId: string;
  let customerId: string;
  let adminToken: string;
  let customerToken: string;
  let staffToken: string;

  beforeAll(async () => {
    if (!databaseUrl) throw new Error('Set CINEX_ROOM_TEST_DATABASE_URL.');
    const target = new URL(databaseUrl);
    if (
      !['postgres:', 'postgresql:'].includes(target.protocol) ||
      !['127.0.0.1', 'localhost'].includes(target.hostname) ||
      target.pathname !== '/cinex_room_test'
    ) {
      throw new Error(
        'Use a disposable loopback database named cinex_room_test.',
      );
    }
    // The Prisma adapter reads DATABASE_URL at construction. Restore the process
    // setting once the pool has captured the isolated target.
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = databaseUrl;
    try {
      db = new PrismaService();
    } finally {
      if (originalUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalUrl;
    }

    const fixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(db)
      .overrideProvider(AUTH_SETTINGS)
      .useValue({
        jwtSecret: secret,
        jwtAccessTokenTtlSeconds: 600,
        jwtRefreshTokenTtlDays: 7,
      })
      .compile();
    app = fixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureHttp(app);
    await app.init();

    const cinema = await db.cinema.create({
      data: {
        name: 'Test cinema',
        address: 'Test address',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    });
    cinemaId = cinema.id;
    movieId = (
      await db.movie.create({ data: { title: 'Test movie', durationMins: 90 } })
    ).id;
    for (const role of [UserRole.ADMIN, UserRole.CUSTOMER, UserRole.STAFF]) {
      const email = `${role.toLowerCase()}-${randomUUID()}@example.com`;
      const user = await db.user.create({
        data: {
          email,
          normalizedEmail: email,
          passwordHash: 'unused-test-fixture',
          role,
        },
      });
      const token = `Bearer ${sign({}, secret, {
        subject: user.id,
        issuer: 'cinex-api',
        audience: 'cinex-client',
        expiresIn: 600,
      })}`;
      if (role === UserRole.ADMIN) adminToken = token;
      if (role === UserRole.STAFF) staffToken = token;
      if (role === UserRole.CUSTOMER) {
        customerId = user.id;
        customerToken = token;
      }
    }
  });

  afterAll(async () => {
    if (app) await app.close();
    else await db?.$disconnect();
  });

  it('requires admin for all management endpoints', async () => {
    const server = request(app.getHttpServer());
    const cinemaRooms = `/admin/cinemas/${cinemaId}/rooms`;
    const room = `/admin/rooms/${randomUUID()}`;
    const seat = `${room}/seats/${randomUUID()}`;
    const calls = () => [
      server.get(cinemaRooms),
      server.post(cinemaRooms).send({ name: 'Room' }),
      server.get(room),
      server.patch(room).send({ name: 'Room' }),
      server.delete(room),
      server.get(`${room}/seats`),
      server.post(`${room}/seats`).send({ rowLabel: 'A', seatNumber: 1 }),
      server.get(seat),
      server.patch(seat).send({ seatType: 'VIP' }),
      server.delete(seat),
    ];
    for (const call of calls()) await call.expect(401);
    for (const token of [customerToken, staffToken]) {
      for (const call of calls()) {
        await call.set('Authorization', token).expect(403);
      }
    }
  });

  it('validates and manages rooms and seats before inventory and scopes each seat to its room', async () => {
    const server = request(app.getHttpServer());
    const collection = `/admin/cinemas/${cinemaId}/rooms`;
    const roomName = `Room ${randomUUID()}`;
    await server
      .post(`/admin/cinemas/${randomUUID()}/rooms`)
      .set('Authorization', adminToken)
      .send({ name: roomName })
      .expect(404);

    const created = await server
      .post(collection)
      .set('Authorization', adminToken)
      .send({ name: ` ${roomName} ` })
      .expect(201);
    const room = expectRoom(created.body, {
      cinemaId,
      name: roomName,
      layoutLocked: false,
    });
    const path = `/admin/rooms/${room.id}`;
    await server.get(collection).set('Authorization', adminToken).expect(200);
    await server.get(path).set('Authorization', adminToken).expect(200);
    await server
      .post(collection)
      .set('Authorization', adminToken)
      .send({ name: roomName })
      .expect(409);
    await server
      .patch(path)
      .set('Authorization', adminToken)
      .send({ name: `${roomName} Updated` })
      .expect(200);

    const seatInput = { rowLabel: ' A ', seatNumber: 1, seatType: 'VIP' };
    for (const invalid of [
      { ...seatInput, seatType: 'INVALID' },
      { ...seatInput, seatNumber: '1' },
      { ...seatInput, roomId: room.id },
    ]) {
      await server
        .post(`${path}/seats`)
        .set('Authorization', adminToken)
        .send(invalid)
        .expect(400);
    }
    const response = await server
      .post(`${path}/seats`)
      .set('Authorization', adminToken)
      .send(seatInput)
      .expect(201);
    const seat = expectRoom(response.body, {
      roomId: room.id,
      rowLabel: 'A',
      seatType: 'VIP',
    });
    const seatPath = `${path}/seats/${seat.id}`;
    await server
      .post(`${path}/seats`)
      .set('Authorization', adminToken)
      .send(seatInput)
      .expect(409);

    const other = await db.cinemaRoom.create({
      data: { cinemaId, name: `Other ${randomUUID()}` },
    });
    const wrongPath = `/admin/rooms/${other.id}/seats/${seat.id}`;
    await server.get(wrongPath).set('Authorization', adminToken).expect(404);
    await server
      .patch(wrongPath)
      .set('Authorization', adminToken)
      .send({ seatType: 'STANDARD' })
      .expect(404);
    await server.delete(wrongPath).set('Authorization', adminToken).expect(404);

    await server
      .get(`${path}/seats`)
      .set('Authorization', adminToken)
      .expect(200);
    await server.get(seatPath).set('Authorization', adminToken).expect(200);
    const edited = await server
      .patch(seatPath)
      .set('Authorization', adminToken)
      .send({ seatNumber: 2, seatType: 'COUPLE' })
      .expect(200);
    expectRoom(edited.body, { seatNumber: 2, seatType: 'COUPLE' });
    await server.delete(seatPath).set('Authorization', adminToken).expect(204);
    await server.get(seatPath).set('Authorization', adminToken).expect(404);

    const unusedSeat = await db.seat.create({
      data: { roomId: room.id, rowLabel: 'B', seatNumber: 1 },
    });
    await server.delete(path).set('Authorization', adminToken).expect(409);
    await server
      .delete(`${path}/seats/${unusedSeat.id}`)
      .set('Authorization', adminToken)
      .expect(204);
    await server.delete(path).set('Authorization', adminToken).expect(204);
    await server.get(path).set('Authorization', adminToken).expect(404);
  });

  it('locks the layout on inventory generation and preserves booked room and seat labels', async () => {
    const server = request(app.getHttpServer());
    const { room, seat, showtime } = await layout();
    const spare = await db.seat.create({
      data: { roomId: room.id, rowLabel: 'A', seatNumber: 2 },
    });
    const inventory = await db.showtimeSeat.create({
      data: { showtimeId: showtime.id, seatId: seat.id, priceMinor: 90000 },
    });
    const reservation = await db.reservation.create({
      data: {
        userId: customerId,
        showtimeId: showtime.id,
        expiresAt: new Date('2030-01-01T11:00:00Z'),
      },
    });
    const booking = await db.booking.create({
      data: {
        userId: customerId,
        showtimeId: showtime.id,
        reservationId: reservation.id,
        totalMinor: 90000,
        status: 'CONFIRMED',
      },
    });
    await db.showtimeSeat.update({
      where: { id: inventory.id },
      data: { status: 'BOOKED', bookingId: booking.id },
    });
    const item = await db.bookingItem.create({
      data: {
        bookingId: booking.id,
        showtimeSeatId: inventory.id,
        priceMinor: 90000,
      },
    });

    const path = `/admin/rooms/${room.id}`;
    const seatPath = `${path}/seats/${seat.id}`;
    for (const call of [
      server.patch(path).send({ name: 'Rename' }),
      server.delete(path),
      server.post(`${path}/seats`).send({ rowLabel: 'B', seatNumber: 1 }),
      server.patch(seatPath).send({ rowLabel: 'B' }),
      server.patch(seatPath).send({ seatNumber: 3 }),
      server.patch(seatPath).send({ seatType: 'VIP' }),
      server.delete(`${path}/seats/${spare.id}`),
    ]) {
      await call
        .set('Authorization', adminToken)
        .expect(409)
        .expect(({ body }: { body: unknown }) => {
          expect(body).toMatchObject({ error: { code: 'ROOM_LAYOUT_LOCKED' } });
        });
    }

    await server
      .patch(path)
      .set('Authorization', adminToken)
      .send({ status: 'INACTIVE' })
      .expect(200);
    await server
      .patch(seatPath)
      .set('Authorization', adminToken)
      .send({ isEnabled: false })
      .expect(200);
    await expect(
      db.seat.update({ where: { id: seat.id }, data: { rowLabel: 'B' } }),
    ).rejects.toThrow();
    await expect(
      db.showtimeSeat.delete({ where: { id: inventory.id } }),
    ).rejects.toThrow();

    const history = await db.bookingItem.findUniqueOrThrow({
      where: { id: item.id },
      include: {
        showtimeSeat: { include: { seat: { include: { room: true } } } },
      },
    });
    expect(history.showtimeSeat).toMatchObject({
      status: 'BOOKED',
      priceMinor: 90000,
      seat: {
        id: seat.id,
        rowLabel: 'A',
        seatNumber: 1,
        room: { name: room.name, layoutLocked: true },
      },
    });
  });

  it('serializes the first inventory write against a destructive layout edit', async () => {
    const { room, seat, showtime } = await layout();
    const ready = deferred();
    const finish = deferred();
    const inventory = db.$transaction(async (tx) => {
      await tx.showtimeSeat.create({
        data: { showtimeId: showtime.id, seatId: seat.id, priceMinor: 90000 },
      });
      ready.resolve();
      await finish.promise;
    });

    try {
      await Promise.race([ready.promise, inventory]);
      const edit = request(app.getHttpServer())
        .patch(`/admin/rooms/${room.id}/seats/${seat.id}`)
        .set('Authorization', adminToken)
        .send({ rowLabel: 'B' })
        .expect(409)
        .then((response) => response);
      try {
        await waitForRoomLock();
      } finally {
        finish.resolve();
        await Promise.all([inventory, edit]);
      }
    } finally {
      finish.resolve();
      await inventory;
    }
    expect(await db.seat.findUnique({ where: { id: seat.id } })).toMatchObject({
      rowLabel: 'A',
    });
  });

  it('prevents duplicate concurrent inventory and keeps the layout lock after inventory deletion', async () => {
    const { room, seat, showtime } = await layout();
    const data = {
      showtimeId: showtime.id,
      seatId: seat.id,
      priceMinor: 90000,
    };
    const inserted = await Promise.all([
      db.showtimeSeat.createMany({ data, skipDuplicates: true }),
      db.showtimeSeat.createMany({ data, skipDuplicates: true }),
    ]);
    expect(inserted.map(({ count }) => count).sort()).toEqual([0, 1]);

    await db.showtimeSeat.deleteMany({ where: { showtimeId: showtime.id } });
    await request(app.getHttpServer())
      .delete(`/admin/rooms/${room.id}/seats/${seat.id}`)
      .set('Authorization', adminToken)
      .expect(409)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({ error: { code: 'ROOM_LAYOUT_LOCKED' } });
      });
  });

  it('blocks deletion of an empty room that is referenced by a showtime', async () => {
    const { room, seat } = await layout();
    await db.seat.delete({ where: { id: seat.id } });
    await request(app.getHttpServer())
      .delete(`/admin/rooms/${room.id}`)
      .set('Authorization', adminToken)
      .expect(409)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({ error: { code: 'ROOM_IN_USE' } });
      });
    expect(
      await db.cinemaRoom.findUnique({ where: { id: room.id } }),
    ).not.toBeNull();
  });

  it('rejects cross-room inventory without locking either room', async () => {
    const source = await layout();
    const target = await layout();
    await expect(
      db.showtimeSeat.create({
        data: {
          showtimeId: target.showtime.id,
          seatId: source.seat.id,
          priceMinor: 90000,
        },
      }),
    ).rejects.toThrow();
    for (const room of [source.room, target.room]) {
      expect(
        await db.cinemaRoom.findUnique({ where: { id: room.id } }),
      ).toMatchObject({ layoutLocked: false });
    }
  });

  it('keeps a showtime in the original room after inventory exists', async () => {
    const { room, seat, showtime } = await layout();
    const target = await layout();
    await db.showtimeSeat.create({
      data: { showtimeId: showtime.id, seatId: seat.id, priceMinor: 90000 },
    });
    await expect(
      db.showtime.update({
        where: { id: showtime.id },
        data: { roomId: target.room.id },
      }),
    ).rejects.toThrow();
    expect(
      await db.showtime.findUnique({ where: { id: showtime.id } }),
    ).toMatchObject({ roomId: room.id });
  });

  async function waitForRoomLock() {
    for (let attempt = 0; attempt < 50; attempt++) {
      const [activity] = await db.$queryRaw<{ waiting: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM pg_stat_activity
          WHERE datname = current_database()
            AND wait_event_type = 'Lock'
            AND query LIKE '%FOR NO KEY UPDATE%'
            AND pid <> pg_backend_pid()
        ) AS waiting
      `;
      if (activity.waiting) return;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error('The API did not wait on the room row lock.');
  }

  async function layout() {
    const room = await db.cinemaRoom.create({
      data: { cinemaId, name: `Layout ${randomUUID()}` },
    });
    const seat = await db.seat.create({
      data: { roomId: room.id, rowLabel: 'A', seatNumber: 1 },
    });
    const showtime = await db.showtime.create({
      data: {
        roomId: room.id,
        movieId,
        startsAt: new Date('2030-01-01T10:00:00Z'),
        endsAt: new Date('2030-01-01T12:00:00Z'),
      },
    });
    return { room, seat, showtime };
  }
});

function expectRoom(body: unknown, fields: object) {
  expect(body).toMatchObject({
    data: { ...fields, id: expect.any(String) as string },
  });
  return (body as { data: { id: string } }).data;
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}
