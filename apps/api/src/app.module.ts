import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MoviesModule } from './movies/movies.module';
import { CinemasModule } from './cinemas/cinemas.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    MoviesModule,
    CinemasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
