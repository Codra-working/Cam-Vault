import {
  Body, Controller, Get, HttpCode, HttpStatus, Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import AuthService from './auth.service.js';
import AuthGuard from './auth.guard.js';

@Controller('auth')
export default class AuthController {
  constructor(private authService:AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto:Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
