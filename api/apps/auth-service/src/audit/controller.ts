import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../../libs/common/src/auth-context';
import { auditRoutes } from './routes';
import { AuditService } from './service';

@ApiTags('audit')
@ApiBearerAuth()
@Controller(auditRoutes.base)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @ApiQuery({ name: 'cursor', required: false, description: 'Opaque cursor from the previous page, `createdAt|id`.' })
  @ApiQuery({ name: 'take', required: false, description: 'Page size, default 50, maximum 100.' })
  @Get(auditRoutes.audit)
  list(@CurrentUser() user: AuthUser, @Query('cursor') cursor?: string, @Query('take') take?: string) {
    const parsed = take ? Number(take) : undefined;
    return this.audit.list(user, { cursor, take: parsed != null && Number.isFinite(parsed) ? parsed : undefined });
  }
}
