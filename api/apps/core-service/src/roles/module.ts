import { Module } from '@nestjs/common';
import { RolesController } from './controller';
import { RolesService } from './service';

@Module({ controllers: [RolesController], providers: [RolesService] })
export class RolesModule {}
