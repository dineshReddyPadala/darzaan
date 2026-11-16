import { Module } from '@nestjs/common';
import { DashboardController } from './controller';
import { DashboardService } from './service';

@Module({ controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
