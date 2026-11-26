import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AcceptRequestInput } from '../common/request-validation';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @AcceptRequestInput('body')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @AcceptRequestInput('body')
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('refresh')
  @AcceptRequestInput('body')
  @HttpCode(200)
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body);
  }

  @Post('logout')
  @AcceptRequestInput('body')
  @HttpCode(200)
  logout(@Body() body: RefreshTokenDto) {
    return this.authService.logout(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() request: Request) {
    return request.user;
  }
}
