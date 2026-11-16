import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import { WorkspaceService } from '../shared/workspace.service';
import type { OrderBodyDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private readonly workspace: WorkspaceService) {}

  create(user: AuthUser, body: OrderBodyDto, key: string, correlationId: string) {
    return this.workspace.createOrder(user, body as Record<string, unknown>, key, correlationId);
  }

  update(user: AuthUser, id: string, body: OrderBodyDto, key: string, correlationId: string, expectedVersion?: number) {
    return this.workspace.updateOrder(user, id, body as Record<string, unknown>, key, correlationId, expectedVersion);
  }
}
