import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../../libs/common/src/auth-context';
import type { ImportSeedDto } from './dto';
import { stateRoutes } from './routes';
import { StateService } from './service';

@ApiTags('state')
@ApiBearerAuth()
@Controller(stateRoutes.base)
export class StateController {
  constructor(private readonly state: StateService) {}

  @Get(stateRoutes.root)
  load(@CurrentUser() user: AuthUser) {
    return this.state.load(user);
  }

  @Post(stateRoutes.import)
  importSeed(@CurrentUser() user: AuthUser, @Body() body: ImportSeedDto) {
    return this.state.importSeed(user, body ?? {});
  }
}
