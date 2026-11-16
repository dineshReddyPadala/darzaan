import { Module } from '@nestjs/common';
import { CollectionsController } from './controller';
import { CollectionsService } from './service';

@Module({ controllers: [CollectionsController], providers: [CollectionsService] })
export class CollectionsModule {}
