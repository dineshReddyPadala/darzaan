import { Module } from '@nestjs/common';
import { HealthController } from './health/controller';
import { MessagesModule } from './messages/module';
import { NotificationsModule } from './notifications/module';
import { SharedModule } from './shared/module';

@Module({
  imports: [SharedModule, NotificationsModule, MessagesModule],
  controllers: [HealthController],
})
export class AppModule {}