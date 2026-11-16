import { Injectable } from '@nestjs/common';
import { WorkspaceService } from '../shared/workspace.service';

@Injectable()
export class RolesService {
  constructor(private readonly workspace: WorkspaceService) {}

  catalog() {
    return this.workspace.roles();
  }
}
