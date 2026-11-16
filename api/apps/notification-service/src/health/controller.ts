import { Controller, Get } from '@nestjs/common';
import { registry } from '../../../../libs/observability/src/metrics';
import { PrismaService } from '../shared/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health/live')
  live() {
    return { status: 'ok' };
  }

  @Get('health/ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'up' };
  }

  @Get('metrics')
  metrics() {
    return registry.metrics();
  }
}
