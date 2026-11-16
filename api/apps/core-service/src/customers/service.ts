import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import { WorkspaceService } from '../shared/workspace.service';
import type { CustomerBodyDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(private readonly workspace: WorkspaceService) {}

  save(user: AuthUser, body: CustomerBodyDto, key: string, creating: boolean) {
    return this.workspace.saveCustomer(user, body as Record<string, unknown>, key, creating);
  }
}
