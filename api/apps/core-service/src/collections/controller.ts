import { Body, Controller, Headers, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { CurrentUser, type AuthUser } from '../../../../libs/common/src/auth-context';
import type { CollectionBodyDto } from './dto';
import { collectionRoutes } from './routes';
import { CollectionsService } from './service';

@ApiTags('collections')
@ApiBearerAuth()
@Controller(collectionRoutes.base)
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Put(collectionRoutes.item)
  save(@CurrentUser() user: AuthUser, @Param('key') key: string, @Body() body: CollectionBodyDto, @Headers('x-request-id') requestId = '') {
    return this.collections.save(user, key, body, requestId || randomUUID());
  }
}
