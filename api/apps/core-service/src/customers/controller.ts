import { Body, Controller, Headers, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { CurrentUser, type AuthUser } from '../../../../libs/common/src/auth-context';
import { CustomerBodyDto } from './dto';
import { customerRoutes } from './routes';
import { CustomersService } from './service';

@ApiTags('customers')
@ApiBearerAuth()
@Controller(customerRoutes.base)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() body: CustomerBodyDto, @Headers('idempotency-key') key = '') {
    const result = await this.customers.save(user, body, key || textId(body), true);
    return result.body;
  }

  @Patch(customerRoutes.item)
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: CustomerBodyDto, @Headers('idempotency-key') key = '') {
    const result = await this.customers.save(user, { ...body, id }, key || `${id}:${randomUUID()}`, false);
    return result.body;
  }
}

function textId(body: CustomerBodyDto): string {
  return typeof body.id === 'string' && body.id ? body.id : randomUUID();
}
