import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { productionRoutes } from './routes';
import { ProductionService } from './service';

@ApiTags('production')
@ApiBearerAuth()
@Controller(productionRoutes.board)
export class ProductionController {
  constructor(private readonly production: ProductionService) {}

  @Get()
  board() {
    return this.production.board();
  }
}
