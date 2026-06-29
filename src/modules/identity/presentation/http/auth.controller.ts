import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { successResponse } from '../../../../shared/http/api-response';
import { AuthService } from '../../application/auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CurrentAuthUser } from './current-auth-user.decorator';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginWithMobileDto } from './dto/login-with-mobile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendLoginOtpDto } from './dto/send-login-otp.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';

@Controller('user')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    return successResponse(result, 'Login successful');
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return successResponse(result, 'Registration successful');
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(body.email);
    return successResponse(result, 'Password reset instructions sent');
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    if (body.password !== body.password_confirmation) {
      throw new BadRequestException('Passwords do not match');
    }

    const result = await this.authService.resetPassword(
      body.email,
      body.token,
      body.password,
    );
    return successResponse(result, 'Password reset successful');
  }

  @Post('send-otp')
  async sendOtp(@Body() body: SendOtpDto) {
    const identifier = body.identifier ?? body.value;

    if (!identifier) {
      throw new BadRequestException('Identifier is required');
    }

    await this.authService.sendOtp(identifier);
    return successResponse(null, 'OTP sent successfully');
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const identifier = body.identifier ?? body.value;

    if (!identifier) {
      throw new BadRequestException('Identifier is required');
    }

    const otp = body.otp;
    const result = await this.authService.verifyOtp(identifier, otp);
    return successResponse(result, 'OTP verified');
  }

  @Post('send-login-otp')
  async sendLoginOtp(@Body() body: SendLoginOtpDto) {
    await this.authService.sendLoginOtp(body.mobile_number);
    return successResponse(null, 'OTP sent successfully to your mobile');
  }

  @Post('login-with-mobile')
  async loginWithMobile(@Body() body: LoginWithMobileDto) {
    const result = await this.authService.loginWithMobile(
      body.mobile_number,
      body.otp,
    );

    return successResponse(result, 'Login successful');
  }

  @Post('oauth-login')
  async oauthLogin(
    @Body() body: OauthLoginDto,
    @Headers('x-social-auth-secret') socialAuthSecret?: string,
  ) {
    const result = await this.authService.loginWithOauth(
      body,
      socialAuthSecret,
    );

    return successResponse(result, 'Login successful');
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCurrentUser(@CurrentAuthUser() authUser: { userId: number }) {
    const user = await this.authService.getCurrentUser(authUser.userId);

    return successResponse(user, 'Success');
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    this.authService.logout();

    return successResponse(null, 'Logged out successfully');
  }
}
