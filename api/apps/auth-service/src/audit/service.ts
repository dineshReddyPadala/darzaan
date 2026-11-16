import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import { AuthService } from '../auth/service';
import type { AuditQueryDto } from './dto';

@Injectable()
export class AuditService {
  constructor(private readonly auth: AuthService) {}

  list(actor: AuthUser, query: AuditQueryDto) {
    return this.auth.listAudit(actor, query);
  }
}
