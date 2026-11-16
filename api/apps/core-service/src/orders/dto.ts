import { ApiPropertyOptional } from '@nestjs/swagger';

/** Desk order document. Extra fields are stored with the order. */
export class OrderBodyDto {
  @ApiPropertyOptional()
  id?: string | number;

  @ApiPropertyOptional()
  customerId?: string | number;

  @ApiPropertyOptional()
  storeId?: number;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  deliveryDate?: string;

  @ApiPropertyOptional()
  priority?: string;
}
