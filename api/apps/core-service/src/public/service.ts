import { Injectable } from '@nestjs/common';
import { WorkspaceService } from '../shared/workspace.service';
import type { PublicBookingDto } from './dto';

@Injectable()
export class PublicService {
  constructor(private readonly workspace: WorkspaceService) {}

  order(id: string) {
    return this.workspace.publicOrder(id);
  }

  booking(body: PublicBookingDto) {
    return this.workspace.publicBooking(body);
  }
}
