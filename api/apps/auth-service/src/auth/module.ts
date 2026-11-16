import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Mailer } from '../../../../libs/mail/src/mailer';
import { AuthController } from './controller';
import { AuthService } from './service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET ?? 'dev-only-change-me', signOptions: { expiresIn: '15m' } })],
  controllers: [AuthController],
  providers: [AuthService, Mailer],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
