import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import { WorkspaceService } from '../shared/workspace.service';
import type { InspectionBodyDto } from './dto';

@Injectable()
export class QcService {
  constructor(private readonly workspace: WorkspaceService) {}

  saveInspection(user: AuthUser, body: InspectionBodyDto, key: string) {
    return this.workspace.saveInspection(user, body as Record<string, unknown>, key);
  }
}
