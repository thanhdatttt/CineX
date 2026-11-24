import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { TmdbModule } from '../integrations/tmdb/tmdb.module';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';

@Module({
  imports: [DatabaseModule, AuthModule, TmdbModule],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
