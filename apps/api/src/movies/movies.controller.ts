import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AcceptRequestInput, IdParamsDto } from '../common/request-validation';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PublicationStatus, UserRole } from '../generated/prisma/enums';
import {
  ImportTmdbMovieDto,
  TmdbMovieParamsDto,
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
  @AcceptRequestInput('query')
  list(@Query() query: ListMoviesQueryDto) {
    return this.movies.listPublic(query);
  }

  @Get('movies/:id')
  get(@Param() { id }: IdParamsDto) {
    return this.movies.getPublic(id);
  }

  @Get('admin/tmdb/movies')
  @AcceptRequestInput('query')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  searchTmdb(@Query() query: SearchTmdbMoviesQueryDto) {
    return this.movies.searchTmdb(query);
  }

  @Get('admin/tmdb/movies/:tmdbId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getTmdbCandidate(@Param() { tmdbId }: TmdbMovieParamsDto) {
    return this.movies.getTmdbCandidate(tmdbId);
  }

  @Post('admin/movies/import-tmdb')
  @AcceptRequestInput('body')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  importTmdb(@Body() input: ImportTmdbMovieDto) {
    return this.movies.importTmdbMovie(input);
  }

  @Post('admin/movies')
  @AcceptRequestInput('body')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() input: CreateMovieDto) {
    return this.movies.create(input);
  }

  @Patch('admin/movies/:id')
  @AcceptRequestInput('body')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param() { id }: IdParamsDto, @Body() input: UpdateMovieDto) {
    return this.movies.update(id, input);
  }

  @Post('admin/movies/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  publish(@Param() { id }: IdParamsDto) {
    return this.movies.setStatus(id, PublicationStatus.PUBLISHED);
  }

  @Post('admin/movies/:id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  unpublish(@Param() { id }: IdParamsDto) {
    return this.movies.setStatus(id, PublicationStatus.DRAFT);
  }

  @Post('admin/movies/:id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  archive(@Param() { id }: IdParamsDto) {
    return this.movies.setStatus(id, PublicationStatus.ARCHIVED);
  }
}
