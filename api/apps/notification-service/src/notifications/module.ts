import { Module } from '@nestjs/common';
import { Mailer } from '../../../../libs/mail/src/mailer';
import { LogNotificationChannel } from './channel';
import { NotificationsController } from './controller';
import { NotificationsService } from './service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, Mailer, LogNotificationChannel],
  exports: [NotificationsService],
})
export class NotificationsModule {}
