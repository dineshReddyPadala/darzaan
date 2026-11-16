import { Module } from '@nestjs/common';
import { CustomersController } from './controller';
import { CustomersService } from './service';

@Module({ controllers: [CustomersController], providers: [CustomersService] })
export class CustomersModule {}
