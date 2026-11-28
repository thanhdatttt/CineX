import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ApiExceptionFilter } from './common/api-exception.filter';
import {
  RequestInputInterceptor,
  RequestValidationPipe,
} from './common/request-validation';
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
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestInputInterceptor },
    { provide: APP_PIPE, useClass: RequestValidationPipe },
  ],
})
export class AppModule {}
