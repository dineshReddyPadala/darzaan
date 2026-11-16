import { Module } from '@nestjs/common';
import { QcController } from './controller';
import { QcService } from './service';

@Module({ controllers: [QcController], providers: [QcService] })
export class QcModule {}
