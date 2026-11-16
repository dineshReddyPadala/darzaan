import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../../libs/common/src/auth-context';
import { isRecord } from '../../../../libs/common/src/scope';
import { consultationRoutes } from './routes';
import { ConsultationsService } from './service';

@ApiTags('consultations')
@ApiBearerAuth()
@Controller(consultationRoutes.base)
export class ConsultationsController {
  constructor(private readonly consultations: ConsultationsService) {}

  @Get(consultationRoutes.appointments)
  appointments(@CurrentUser() user: AuthUser) {
    return this.consultations.appointments(user);
  }

  @Get(consultationRoutes.franchise)
  franchise(@CurrentUser() user: AuthUser) {
    return this.consultations.franchise(user);
  }

  @Get(consultationRoutes.slots)
  slots(@CurrentUser() user: AuthUser, @Query('date') date = '') {
    return this.consultations.board(user, date);
  }

  @Patch(consultationRoutes.appointment)
  status(@CurrentUser() user: AuthUser, @Param('reference') reference: string, @Body() body: unknown) {
    const status = isRecord(body) && typeof body.status === 'string' ? body.status : '';
    return this.consultations.setStatus(user, reference, status);
  }
}
