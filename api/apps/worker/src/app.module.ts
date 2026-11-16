import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { WorkerService } from './worker.service';

@Module({
  controllers: [HealthController],
  providers: [PrismaService, WorkerService],
})
export class AppModule {}
