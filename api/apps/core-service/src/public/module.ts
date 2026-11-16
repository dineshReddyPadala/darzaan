import { Module } from '@nestjs/common';
import { ConsultationsModule } from '../consultations/module';
import { PublicController } from './controller';
import { PublicService } from './service';

@Module({ imports: [ConsultationsModule], controllers: [PublicController], providers: [PublicService] })
export class PublicModule {}
