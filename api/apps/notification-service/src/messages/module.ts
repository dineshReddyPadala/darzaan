import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/module';
import { MessagesController } from './controller';
import { MessagesService } from './service';

@Module({
  imports: [NotificationsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
