import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog/module';
import { ConsultationsModule } from './consultations/module';
import { CollectionsModule } from './collections/module';
import { CustomersModule } from './customers/module';
import { DashboardModule } from './dashboard/module';
import { HealthController } from './health/controller';
import { OrdersModule } from './orders/module';
import { ProductionModule } from './production/module';
import { PublicModule } from './public/module';
import { QcModule } from './qc/module';
import { RolesModule } from './roles/module';
import { SharedModule } from './shared/module';
import { StateModule } from './state/module';

@Module({
  imports: [
    SharedModule,
    StateModule,
    OrdersModule,
    CustomersModule,
    CollectionsModule,
    QcModule,
    ProductionModule,
    DashboardModule,
    CatalogModule,
    RolesModule,
    PublicModule,
    ConsultationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
