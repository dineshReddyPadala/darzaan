import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { isRecord } from '../../../../libs/common/src/scope';
import { ConsultationsService } from '../consultations/service';
import type { PublicBookingDto } from './dto';
import { publicRoutes } from './routes';
import { PublicService } from './service';

@ApiTags('public')
@Controller(publicRoutes.base)
export class PublicController {
  constructor(private readonly desk: PublicService, private readonly consultations: ConsultationsService) {}

  @Get(publicRoutes.order)
  order(@Param('id') id: string) {
    return this.desk.order(id);
  }

  @Post(publicRoutes.bookings)
  booking(@Body() body: PublicBookingDto) {
    return this.desk.booking(isRecord(body) ? body : {});
  }

  @Get(publicRoutes.slots)
  slots(@Query('date') date = '', @Query('mode') mode = '') {
    return this.consultations.slots(date, mode);
  }

  @Post(publicRoutes.appointments)
  @HttpCode(HttpStatus.CREATED)
  appointments(@Body() body: unknown) {
    return this.consultations.createAppointment(isRecord(body) ? body : {});
  }

  @Post(publicRoutes.franchise)
  @HttpCode(HttpStatus.CREATED)
  franchise(@Body() body: unknown) {
    return this.consultations.createFranchise(isRecord(body) ? body : {});
  }
}
