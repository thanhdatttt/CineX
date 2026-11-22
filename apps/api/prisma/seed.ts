import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  PublicationStatus,
  RecordStatus,
  SeatType,
} from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const ids = {
  movie: '10000000-0000-4000-8000-000000000001',
  cinema: '20000000-0000-4000-8000-000000000001',
  room: '30000000-0000-4000-8000-000000000001',
  seatA1: '40000000-0000-4000-8000-000000000001',
  seatA2: '40000000-0000-4000-8000-000000000002',
};

async function main(): Promise<void> {
  await prisma.movie.upsert({
    where: { id: ids.movie },
    update: {},
    create: {
      id: ids.movie,
      title: 'CineX Development Sample',
      synopsis: 'Deterministic catalogue record for local development.',
      durationMins: 120,
      genres: ['Drama'],
      status: PublicationStatus.PUBLISHED,
    },
  });

  await prisma.cinema.upsert({
    where: { id: ids.cinema },
    update: {},
    create: {
      id: ids.cinema,
      name: 'CineX Development Cinema',
      address: '1 Development Street, Ho Chi Minh City',
      timezone: 'Asia/Ho_Chi_Minh',
      status: RecordStatus.ACTIVE,
    },
  });

  await prisma.cinemaRoom.upsert({
    where: { id: ids.room },
    update: {},
    create: {
      id: ids.room,
      cinemaId: ids.cinema,
      name: 'Room 1',
      status: RecordStatus.ACTIVE,
    },
  });

  for (const seat of [
    { id: ids.seatA1, seatNumber: 1, seatType: SeatType.STANDARD },
    { id: ids.seatA2, seatNumber: 2, seatType: SeatType.VIP },
  ]) {
    await prisma.seat.upsert({
      where: { id: seat.id },
      update: {},
      create: {
        ...seat,
        roomId: ids.room,
        rowLabel: 'A',
        isEnabled: true,
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error('Development seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
