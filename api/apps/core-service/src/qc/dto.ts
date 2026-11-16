import { ApiPropertyOptional } from '@nestjs/swagger';

export class InspectionBodyDto {
  @ApiPropertyOptional()
  id?: string;

  @ApiPropertyOptional()
  orderId?: string | number;

  @ApiPropertyOptional()
  garmentId?: string | number;

  @ApiPropertyOptional()
  outcome?: string;

  @ApiPropertyOptional()
  at?: string;
}
