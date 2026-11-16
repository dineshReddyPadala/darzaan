import { Body, Controller, Get, Headers, HttpStatus, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser, type AuthUser } from '../../../../libs/common/src/auth-context';
import { AppError } from '../../../../libs/common/src/http';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RefreshDto, ResetPasswordDto } from './dto';
import { authRoutes } from './routes';
import { AuthService } from './service';

@ApiTags('auth')
@Controller(authRoutes.base)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

  @Post(authRoutes.login)
  login(@Body() body: LoginDto, @Headers('x-request-id') requestId = '') {
    return this.auth.login(body.email, body.password, { requestId });
  }

  @Post(authRoutes.refresh)
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post(authRoutes.logout)
  logout(@Body() body: RefreshDto) {
    return this.auth.logout(body.refreshToken);
  }

  @Post(authRoutes.forgotPassword)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body.email);
  }

  @Post(authRoutes.resetPassword)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body.token, body.password);
  }

  @ApiBearerAuth()
  @Post(authRoutes.changePassword)
  changePassword(@CurrentUser() user: AuthUser, @Body() body: ChangePasswordDto) {
    return this.auth.changePassword(user.sub, body.currentPassword, body.newPassword);
  }

  @ApiBearerAuth()
  @Get(authRoutes.me)
  async me(@Headers('authorization') authorization = '') {
    const token = authorization.replace(/^Bearer\s+/i, '');
    if (!token) throw new AppError(HttpStatus.UNAUTHORIZED, 'Sign in to continue');
    const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
    return this.auth.me(payload.sub);
  }
}
