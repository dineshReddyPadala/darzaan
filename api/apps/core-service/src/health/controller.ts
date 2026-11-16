import { Controller, Get } from '@nestjs/common';
import { kafkaBus } from '../../../../libs/messaging/src';
import { redisHealthy } from '../../../../libs/observability/src/cache';
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
    const redis = await redisHealthy();
    let kafka = true;
    if (process.env.KAFKA_BROKERS) kafka = await kafkaBus.health().catch(() => false);
    return { status: redis && kafka ? 'ok' : 'degraded', database: 'up', redis: redis ? 'up' : 'down', kafka: kafka ? 'up' : 'down' };
  }

  @Get('metrics')
  metrics() {
    return registry.metrics();
  }
}
