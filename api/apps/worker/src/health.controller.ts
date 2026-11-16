import { Controller, Get } from '@nestjs/common';
import { kafkaBus } from '../../../libs/messaging/src';
import { registry } from '../../../libs/observability/src/metrics';
import { PrismaService } from './prisma.service';

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
    const kafka = process.env.KAFKA_BROKERS ? await kafkaBus.health().catch(() => false) : true;
    const unpublished = await this.prisma.outboxEvent.count({ where: { publishedAt: null } });
    return { status: kafka ? 'ok' : 'degraded', database: 'up', kafka: kafka ? 'up' : 'down', outboxUnpublished: unpublished };
  }

  @Get('metrics')
  metrics() {
    return registry.metrics();
  }
}
