import { type Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { AllExceptionsFilter } from './http';
import { createLogger } from '../../observability/src/logger';
import { startTelemetry } from '../../observability/src/telemetry';

export async function bootstrap(module: Type<unknown>, options: { name: string; port: number; prefix?: boolean }): Promise<void> {
  await startTelemetry(options.name);
  const logger = createLogger(options.name);
  const app = await NestFactory.create<NestFastifyApplication>(module, new FastifyAdapter({ logger: false }), { bufferLogs: true });
  app.useLogger({
    log: (message: unknown) => logger.info(typeof message === 'string' ? message : { message }),
    error: (message: unknown, trace?: string) => logger.error({ trace }, typeof message === 'string' ? message : 'error'),
    warn: (message: unknown) => logger.warn(typeof message === 'string' ? message : { message }),
    debug: (message: unknown) => logger.debug(typeof message === 'string' ? message : { message }),
    verbose: (message: unknown) => logger.debug(typeof message === 'string' ? message : { message }),
  });
  const instance = app.getHttpAdapter().getInstance();
  await app.register(helmet, { contentSecurityPolicy: false });
  const origins = process.env.CORS_ORIGINS?.split(',').map((item) => item.trim()).filter(Boolean);
  await app.register(cors, { origin: origins && origins.length > 0 ? origins : true, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] });
  instance.addHook('onRequest', (request, reply, done) => {
    const incoming = request.headers['x-request-id'];
    const requestId = typeof incoming === 'string' && incoming ? incoming : randomUUID();
    request.headers['x-request-id'] = requestId;
    reply.header('x-request-id', requestId);
    done();
  });
  if (options.prefix !== false) app.setGlobalPrefix('api', { exclude: ['health/live', 'health/ready', 'metrics', 'docs'] });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();
  const config = new DocumentBuilder().setTitle(`Darzaan ${options.name}`).setVersion('1').addBearerAuth().build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  await app.listen(options.port, '0.0.0.0');
  logger.info({ port: options.port }, `${options.name} listening`);
}
