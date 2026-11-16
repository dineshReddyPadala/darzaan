import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../../libs/common/src/auth-context';
import { dashboardRoutes } from './routes';
import { DashboardService } from './service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller(dashboardRoutes.kpis)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  kpis(@CurrentUser() user: AuthUser) {
    return this.dashboard.kpis(user);
  }
}
