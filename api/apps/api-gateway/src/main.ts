import 'reflect-metadata';
import { bootstrap } from '../../../libs/common/src/bootstrap';
import { AppModule } from './app.module';

void bootstrap(AppModule, { name: 'api-gateway', port: Number(process.env.PORT ?? 3000), prefix: false });
