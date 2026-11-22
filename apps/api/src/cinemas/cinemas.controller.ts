import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RecordStatus, UserRole } from '../generated/prisma/enums';
import { CinemasService } from './cinemas.service';
import {
  CreateCinemaDto,
  ListCinemasQueryDto,
  UpdateCinemaDto,
} from './cinema.dto';

@Controller()
export class CinemasController {
  constructor(private readonly cinemas: CinemasService) {}

  @Get('cinemas')
  list(@Query() query: ListCinemasQueryDto) {
    return this.cinemas.listPublic(query);
  }

  @Get('cinemas/:id')
  get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.cinemas.getPublic(id);
  }

  @Post('admin/cinemas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() input: CreateCinemaDto) {
    return this.cinemas.create(input);
  }

  @Patch('admin/cinemas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateCinemaDto,
  ) {
    return this.cinemas.update(id, input);
  }

  @Post('admin/cinemas/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.cinemas.setStatus(id, RecordStatus.INACTIVE);
  }

  @Post('admin/cinemas/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  activate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.cinemas.setStatus(id, RecordStatus.ACTIVE);
  }

  @Post('admin/cinemas/:id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  archive(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.cinemas.setStatus(id, RecordStatus.ARCHIVED);
  }
}
