import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import { WorkspaceService } from '../shared/workspace.service';
import type { CollectionBodyDto } from './dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly workspace: WorkspaceService) {}

  save(user: AuthUser, key: string, body: CollectionBodyDto, correlationId: string) {
    return this.workspace.saveCollection(user, key, body, correlationId);
  }
}
