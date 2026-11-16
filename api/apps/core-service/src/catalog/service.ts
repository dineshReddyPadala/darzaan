import { Injectable } from '@nestjs/common';
import { WorkspaceService } from '../shared/workspace.service';

@Injectable()
export class CatalogService {
  constructor(private readonly workspace: WorkspaceService) {}

  get() {
    return this.workspace.catalog();
  }
}
