import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { roleRoutes } from './routes';
import { RolesService } from './service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller(roleRoutes.base)
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  catalog() {
    return this.roles.catalog();
  }
}
