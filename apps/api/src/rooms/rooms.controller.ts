import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  AcceptRequestInput,
  PaginationQueryDto,
} from '../common/request-validation';
import { UserRole } from '../generated/prisma/enums';
import {
  CinemaRoomParamsDto,
  CreateRoomDto,
  CreateSeatDto,
  RoomParamsDto,
  RoomSeatParamsDto,
  UpdateRoomDto,
  UpdateSeatDto,
} from './room.dto';
import { RoomsService } from './rooms.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get('cinemas/:cinemaId/rooms')
  @AcceptRequestInput('query')
  listRooms(
    @Param() { cinemaId }: CinemaRoomParamsDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.rooms.listRooms(cinemaId, query);
  }

  @Post('cinemas/:cinemaId/rooms')
  @AcceptRequestInput('body')
  createRoom(
    @Param() { cinemaId }: CinemaRoomParamsDto,
    @Body() input: CreateRoomDto,
  ) {
    return this.rooms.createRoom(cinemaId, input);
  }

  @Get('rooms/:roomId')
  getRoom(@Param() { roomId }: RoomParamsDto) {
    return this.rooms.getRoom(roomId);
  }

  @Patch('rooms/:roomId')
  @AcceptRequestInput('body')
  updateRoom(@Param() { roomId }: RoomParamsDto, @Body() input: UpdateRoomDto) {
    return this.rooms.updateRoom(roomId, input);
  }

  @Delete('rooms/:roomId')
  @HttpCode(204)
  deleteRoom(@Param() { roomId }: RoomParamsDto) {
    return this.rooms.deleteRoom(roomId);
  }

  @Get('rooms/:roomId/seats')
  @AcceptRequestInput('query')
  listSeats(
    @Param() { roomId }: RoomParamsDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.rooms.listSeats(roomId, query);
  }

  @Post('rooms/:roomId/seats')
  @AcceptRequestInput('body')
  createSeat(@Param() { roomId }: RoomParamsDto, @Body() input: CreateSeatDto) {
    return this.rooms.createSeat(roomId, input);
  }

  @Get('rooms/:roomId/seats/:seatId')
  getSeat(@Param() { roomId, seatId }: RoomSeatParamsDto) {
    return this.rooms.getSeat(roomId, seatId);
  }

  @Patch('rooms/:roomId/seats/:seatId')
  @AcceptRequestInput('body')
  updateSeat(
    @Param() { roomId, seatId }: RoomSeatParamsDto,
    @Body() input: UpdateSeatDto,
  ) {
    return this.rooms.updateSeat(roomId, seatId, input);
  }

  @Delete('rooms/:roomId/seats/:seatId')
  @HttpCode(204)
  deleteSeat(@Param() { roomId, seatId }: RoomSeatParamsDto) {
    return this.rooms.deleteSeat(roomId, seatId);
  }
}
