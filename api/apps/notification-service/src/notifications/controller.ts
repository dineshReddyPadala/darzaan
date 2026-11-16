import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../../libs/common/src/auth-context';
import { NotificationBodyDto } from './dto';
import { notificationRoutes } from './routes';
import { NotificationsService } from './service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller(notificationRoutes.base)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.list(user);
  }

  @Post()
  create(@Body() body: NotificationBodyDto) {
    return this.notifications.create(body as Record<string, unknown>);
  }

  @Post(notificationRoutes.itemRead)
  read(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }

  @Post(notificationRoutes.readAll)
  readAll() {
    return this.notifications.markAllRead();
  }

  @Delete(notificationRoutes.item)
  remove(@Param('id') id: string) {
    return this.notifications.remove(id);
  }
}
