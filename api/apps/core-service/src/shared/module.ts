import { Global, Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { PrismaService } from './prisma.service';
import { WorkspaceService } from './workspace.service';

@Global()
@Module({
  providers: [PrismaService, IdempotencyService, WorkspaceService],
  exports: [PrismaService, IdempotencyService, WorkspaceService],
})
export class SharedModule {}
