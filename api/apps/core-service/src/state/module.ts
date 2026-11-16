import { Module } from '@nestjs/common';
import { StateController } from './controller';
import { StateService } from './service';

@Module({ controllers: [StateController], providers: [StateService] })
export class StateModule {}
