import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { CinemasController } from './cinemas.controller';
import { CinemasService } from './cinemas.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CinemasController],
  providers: [CinemasService],
})
export class CinemasModule {}
