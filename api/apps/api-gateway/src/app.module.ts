import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ProxyController } from './proxy.controller';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET ?? 'dev-only-change-me' })],
  controllers: [ProxyController],
})
export class AppModule {}
