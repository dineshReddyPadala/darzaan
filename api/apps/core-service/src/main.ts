import 'reflect-metadata';
import { bootstrap } from '../../../libs/common/src/bootstrap';
import { AppModule } from './app.module';

void bootstrap(AppModule, { name: 'core-service', port: Number(process.env.PORT ?? 3002) });
