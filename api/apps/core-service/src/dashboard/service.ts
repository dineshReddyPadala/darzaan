import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import { WorkspaceService } from '../shared/workspace.service';

@Injectable()
export class DashboardService {
  constructor(private readonly workspace: WorkspaceService) {}

  kpis(user: AuthUser) {
    return this.workspace.kpis(user);
  }
}
