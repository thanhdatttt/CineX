import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PublicationStatus, UserRole } from '../generated/prisma/enums';
import {
  ImportTmdbMovieDto,
  SearchTmdbMoviesQueryDto,
} from '../integrations/tmdb/tmdb.dto';
import {
  CreateMovieDto,
  ListMoviesQueryDto,
  UpdateMovieDto,
} from './movie.dto';
import { MoviesService } from './movies.service';

@Controller()
export class MoviesController {
  constructor(private readonly movies: MoviesService) {}

  @Get('movies')
  list(@Query() query: ListMoviesQueryDto) {
    return this.movies.listPublic(query);
  }

  @Get('movies/:id')
  get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.movies.getPublic(id);
  }

  @Get('admin/tmdb/movies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  searchTmdb(@Query() query: SearchTmdbMoviesQueryDto) {
    return this.movies.searchTmdb(query);
  }

  @Get('admin/tmdb/movies/:tmdbId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getTmdbCandidate(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.movies.getTmdbCandidate(tmdbId);
  }

  @Post('admin/movies/import-tmdb')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  importTmdb(@Body() input: ImportTmdbMovieDto) {
    return this.movies.importTmdbMovie(input);
  }

  @Post('admin/movies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() input: CreateMovieDto) {
    return this.movies.create(input);
  }

  @Patch('admin/movies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateMovieDto,
  ) {
    return this.movies.update(id, input);
  }

  @Post('admin/movies/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  publish(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.movies.setStatus(id, PublicationStatus.PUBLISHED);
  }

  @Post('admin/movies/:id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  unpublish(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.movies.setStatus(id, PublicationStatus.DRAFT);
  }

  @Post('admin/movies/:id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  archive(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.movies.setStatus(id, PublicationStatus.ARCHIVED);
  }
}
