import { Module } from '@nestjs/common';
import { ProductionController } from './controller';
import { ProductionService } from './service';

@Module({ controllers: [ProductionController], providers: [ProductionService] })
export class ProductionModule {}
