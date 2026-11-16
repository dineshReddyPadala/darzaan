import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { catalogRoutes } from './routes';
import { CatalogService } from './service';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller(catalogRoutes.base)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  get() {
    return this.catalog.get();
  }
}
