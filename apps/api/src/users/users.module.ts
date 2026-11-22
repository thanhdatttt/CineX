import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [UsersController],
  imports: [AuthModule],
  providers: [UsersService],
})
export class UsersModule {}
