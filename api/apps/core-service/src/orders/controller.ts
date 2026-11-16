import { Body, Controller, Headers, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { CurrentUser, type AuthUser } from '../../../../libs/common/src/auth-context';
import { OrderBodyDto } from './dto';
import { orderRoutes } from './routes';
import { OrdersService } from './service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller(orderRoutes.base)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: OrderBodyDto,
    @Headers('idempotency-key') key = '',
    @Headers('x-request-id') requestId = '',
  ) {
    const result = await this.orders.create(user, body, key || randomUUID(), requestId || randomUUID());
    return result.body;
  }

  @Patch(orderRoutes.item)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: OrderBodyDto,
    @Headers('idempotency-key') key = '',
    @Headers('x-request-id') requestId = '',
    @Headers('if-match') ifMatch = '',
  ) {
    const version = ifMatch ? Number(ifMatch) : undefined;
    const result = await this.orders.update(user, id, body, key || randomUUID(), requestId || randomUUID(), Number.isFinite(version) ? version : undefined);
    return result.body;
  }
}
