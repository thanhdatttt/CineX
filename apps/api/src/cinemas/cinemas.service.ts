import { Injectable, NotFoundException } from '@nestjs/common';
import { RecordStatus } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import {
  CreateCinemaDto,
  ListCinemasQueryDto,
  UpdateCinemaDto,
} from './cinema.dto';

const cinemaFields = {
  id: true,
  name: true,
  address: true,
  timezone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CinemasService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(query: ListCinemasQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { status: RecordStatus.ACTIVE };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cinema.findMany({
        where,
        select: cinemaFields,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cinema.count({ where }),
    ]);
    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPublic(id: string) {
    const cinema = await this.prisma.cinema.findFirst({
      where: { id, status: RecordStatus.ACTIVE },
      select: cinemaFields,
    });
    if (!cinema) throw new NotFoundException('Cinema not found.');
    return { data: cinema };
  }

  async create(input: CreateCinemaDto) {
    return {
      data: await this.prisma.cinema.create({
        data: input,
        select: cinemaFields,
      }),
    };
  }

  async update(id: string, input: UpdateCinemaDto) {
    await this.requireCinema(id);
    return {
      data: await this.prisma.cinema.update({
        where: { id },
        data: input,
        select: cinemaFields,
      }),
    };
  }

  async setStatus(id: string, status: RecordStatus) {
    await this.requireCinema(id);
    return {
      data: await this.prisma.cinema.update({
        where: { id },
        data: { status },
        select: cinemaFields,
      }),
    };
  }

  private async requireCinema(id: string): Promise<void> {
    const cinema = await this.prisma.cinema.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!cinema) throw new NotFoundException('Cinema not found.');
  }
}
