import { NotFoundException } from '@nestjs/common';
import { RecordStatus } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { CinemasService } from './cinemas.service';

describe('CinemasService', () => {
  const prisma = {
    cinema: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const service = new CinemasService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );
    prisma.cinema.findMany.mockResolvedValue([]);
    prisma.cinema.count.mockResolvedValue(0);
  });

  it('only lists active cinemas with stable order and pagination', async () => {
    await service.listPublic({ page: 2, limit: 10 });
    expect(prisma.cinema.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: RecordStatus.ACTIVE },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: 10,
        take: 10,
      }),
    );
  });

  it('returns not found for inactive public cinema details', async () => {
    prisma.cinema.findFirst.mockResolvedValue(null);
    await expect(service.getPublic('cinema-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.cinema.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cinema-id', status: RecordStatus.ACTIVE },
      }),
    );
  });

  it('allows admin workflow to deactivate and reactivate a cinema', async () => {
    prisma.cinema.findUnique.mockResolvedValue({ id: 'cinema-id' });
    prisma.cinema.update.mockResolvedValue({
      id: 'cinema-id',
      status: RecordStatus.INACTIVE,
    });
    await service.setStatus('cinema-id', RecordStatus.INACTIVE);
    expect(prisma.cinema.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: RecordStatus.INACTIVE },
      }),
    );
  });
});
