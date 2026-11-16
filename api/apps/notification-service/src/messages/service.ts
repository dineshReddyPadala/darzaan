import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/service';
import type { MessageBodyDto } from './dto';

@Injectable()
export class MessagesService {
  constructor(private readonly notifications: NotificationsService) {}

  send(body: MessageBodyDto) {
    return this.notifications.send(body);
  }
}
