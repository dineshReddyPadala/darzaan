import { Injectable } from '@nestjs/common';
import { WorkspaceService } from '../shared/workspace.service';

@Injectable()
export class ProductionService {
  constructor(private readonly workspace: WorkspaceService) {}

  board() {
    return this.workspace.board();
  }
}
