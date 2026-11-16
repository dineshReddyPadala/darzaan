import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/module';
import { AuditController } from './controller';
import { AuditService } from './service';

@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
