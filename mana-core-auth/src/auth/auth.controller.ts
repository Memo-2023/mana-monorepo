import { Controller, Post, Body, UseGuards, Req, Ip, Headers } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request & { user: CurrentUserData }) {
    // Extract sessionId from JWT (would need to be added to the CurrentUserData interface)
    // For now, we'll use a placeholder
    return this.authService.logout('session-id');
  }

  @Post('validate')
  async validate(@Body() body: { token: string }) {
    return this.authService.validateToken(body.token);
  }
}
