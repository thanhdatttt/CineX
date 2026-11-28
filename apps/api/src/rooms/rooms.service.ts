import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiError } from '../common/api-error';
import type { PaginationQueryDto } from '../common/request-validation';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import type {
  CreateRoomDto,
  CreateSeatDto,
  UpdateRoomDto,
  UpdateSeatDto,
} from './room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRooms(cinemaId: string, { page, limit }: PaginationQueryDto) {
    const cinema = await this.prisma.cinema.findUnique({
      where: { id: cinemaId },
      select: { id: true },
    });
    if (!cinema) throw new NotFoundException('Cinema not found.');

    const where = { cinemaId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.cinemaRoom.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cinemaRoom.count({ where }),
    ]);
    return paginated(data, total, page, limit);
  }

  async createRoom(cinemaId: string, input: CreateRoomDto) {
    try {
      const data = await this.prisma.cinemaRoom.create({
        data: { cinemaId, name: input.name },
      });
      return { data };
    } catch (error) {
      if (prismaError(error, 'P2003'))
        throw new NotFoundException('Cinema not found.');
      if (prismaError(error, 'P2002'))
        throw new ConflictException('Room name already exists.');
      throw error;
    }
  }

  async getRoom(roomId: string) {
    return { data: await this.requireRoom(roomId) };
  }

  async updateRoom(roomId: string, input: UpdateRoomDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const room = await lockRoom(tx, roomId);
        if (input.name !== undefined && input.name !== room.name)
          requireEditable(room);
        const data = await tx.cinemaRoom.update({
          where: { id: roomId },
          data: input,
        });
        return { data };
      });
    } catch (error) {
      if (prismaError(error, 'P2002'))
        throw new ConflictException('Room name already exists.');
      throw error;
    }
  }

  async deleteRoom(roomId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        requireEditable(await lockRoom(tx, roomId));
        await tx.cinemaRoom.delete({ where: { id: roomId } });
      });
    } catch (error) {
      if (prismaError(error, 'P2003')) {
        throw new ApiError(
          HttpStatus.CONFLICT,
          'ROOM_IN_USE',
          'Remove unused seats first or deactivate the room to preserve its showtimes.',
        );
      }
      throw error;
    }
  }

  async listSeats(roomId: string, { page, limit }: PaginationQueryDto) {
    await this.requireRoom(roomId);
    const where = { roomId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.seat.findMany({
        where,
        orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.seat.count({ where }),
    ]);
    return paginated(data, total, page, limit);
  }

  async getSeat(roomId: string, seatId: string) {
    return { data: await requireSeat(this.prisma, roomId, seatId) };
  }

  async createSeat(roomId: string, input: CreateSeatDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        requireEditable(await lockRoom(tx, roomId));
        const data = await tx.seat.create({ data: { ...input, roomId } });
        return { data };
      });
    } catch (error) {
      if (prismaError(error, 'P2002'))
        throw new ConflictException('Seat label already exists in this room.');
      throw error;
    }
  }

  async updateSeat(roomId: string, seatId: string, input: UpdateSeatDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const room = await lockRoom(tx, roomId);
        const seat = await requireSeat(tx, roomId, seatId);
        if (
          (input.rowLabel !== undefined && input.rowLabel !== seat.rowLabel) ||
          (input.seatNumber !== undefined &&
            input.seatNumber !== seat.seatNumber) ||
          (input.seatType !== undefined && input.seatType !== seat.seatType)
        ) {
          requireEditable(room);
        }
        const data = await tx.seat.update({
          where: { id: seatId, roomId },
          data: input,
        });
        return { data };
      });
    } catch (error) {
      if (prismaError(error, 'P2002'))
        throw new ConflictException('Seat label already exists in this room.');
      throw error;
    }
  }

  async deleteSeat(roomId: string, seatId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const room = await lockRoom(tx, roomId);
      await requireSeat(tx, roomId, seatId);
      requireEditable(room);
      await tx.seat.delete({ where: { id: seatId, roomId } });
    });
  }

  private async requireRoom(roomId: string) {
    const room = await this.prisma.cinemaRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found.');
    return room;
  }
}

async function lockRoom(tx: Prisma.TransactionClient, roomId: string) {
  const [room] = await tx.$queryRaw<{ name: string; layoutLocked: boolean }[]>`
    SELECT "name", "layout_locked" AS "layoutLocked"
    FROM "cinema_rooms"
    WHERE "id" = ${roomId}::uuid
    FOR NO KEY UPDATE
  `;
  if (!room) throw new NotFoundException('Room not found.');
  return room;
}

async function requireSeat(
  db: Pick<PrismaService, 'seat'>,
  roomId: string,
  seatId: string,
) {
  const seat = await db.seat.findUnique({ where: { id: seatId, roomId } });
  if (!seat) throw new NotFoundException('Seat not found in this room.');
  return seat;
}

function requireEditable(room: { layoutLocked: boolean }) {
  if (room.layoutLocked) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'ROOM_LAYOUT_LOCKED',
      'This room has generated inventory. Create a new room for a different layout.',
    );
  }
}

function prismaError(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

function paginated<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
