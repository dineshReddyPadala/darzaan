import { Module } from '@nestjs/common';
import { OrdersController } from './controller';
import { OrdersService } from './service';

@Module({ controllers: [OrdersController], providers: [OrdersService] })
export class OrdersModule {}
