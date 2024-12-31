import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Public } from '@/lib/decorators/public';
import { BaseResponse } from '@/lib/payload/response';
import { AuthService } from '../services/auth.service';
import {
  LoginDto,
  RegisterDto,
  ResetEmailDto,
  VerifyEmailDto,
} from '../user.dto';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() data: LoginDto) {
    return new BaseResponse(
      2100,
      'Login successful',
      await this.authService.login(data),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  refreshToken(@Body('refreshToken') refreshToken: string) {
    return new BaseResponse(
      2100,
      'Token refreshed',
      this.authService.refreshTokens(refreshToken),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('register')
  async register(@Body() data: RegisterDto) {
    return new BaseResponse(
      2100,
      'Register successful',
      await this.authService.register(data),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-email')
  async resendVerificationCode(@Body('email') email: string) {
    return new BaseResponse(
      2100,
      'Verification code sent',
      await this.authService.resendVerificationCode(email),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(@Body() data: VerifyEmailDto) {
    return new BaseResponse(
      2100,
      'Email verified',
      await this.authService.verifyEmail(data.email, data.code),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return new BaseResponse(
      2100,
      'Password reset code sent',
      await this.authService.forgotPassword(email),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() data: ResetEmailDto) {
    return new BaseResponse(
      2100,
      'Password reset successful',
      await this.authService.resetPassword(
        data.email,
        data.code,
        data.password,
      ),
    );
  }
}
