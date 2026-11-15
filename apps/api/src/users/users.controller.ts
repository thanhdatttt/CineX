import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../generated/prisma/enums';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId')
  getProfile(@Req() request: Request, @Param('userId') userId: string) {
    return this.usersService.getProfile(request.user!, userId);
  }

  @Get('admin/identity-check')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  adminIdentityCheck() {
    return { status: 'authorized' };
  }
}
