import { Module } from '@nestjs/common';
import { ConsultationsController } from './controller';
import { ConsultationsService } from './service';

@Module({
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
