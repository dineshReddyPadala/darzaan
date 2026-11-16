import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import { WorkspaceService } from '../shared/workspace.service';
import type { ImportSeedDto } from './dto';

@Injectable()
export class StateService {
  constructor(private readonly workspace: WorkspaceService) {}

  load(user: AuthUser) {
    return this.workspace.state(user);
  }

  importSeed(user: AuthUser, body: ImportSeedDto) {
    return this.workspace.importSeed(user, body);
  }
}
