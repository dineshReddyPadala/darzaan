import { Module } from '@nestjs/common';
import { AuditModule } from './audit/module';
import { AuthModule } from './auth/module';
import { HealthController } from './health/controller';
import { SharedModule } from './shared/module';
import { UsersModule } from './users/module';

@Module({
  imports: [SharedModule, AuthModule, UsersModule, AuditModule],
  controllers: [HealthController],
})
export class AppModule {}
