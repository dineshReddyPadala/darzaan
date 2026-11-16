import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { CurrentUser, type AuthUser } from '../../../../libs/common/src/auth-context';
import { InspectionBodyDto } from './dto';
import { qcRoutes } from './routes';
import { QcService } from './service';

@ApiTags('qc')
@ApiBearerAuth()
@Controller(qcRoutes.inspections)
export class QcController {
  constructor(private readonly qc: QcService) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() body: InspectionBodyDto, @Headers('idempotency-key') key = '') {
    const result = await this.qc.saveInspection(user, body, key || (typeof body.id === 'string' && body.id ? body.id : randomUUID()));
    return result.body;
  }
}
