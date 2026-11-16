import { ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerBodyDto {
  @ApiPropertyOptional()
  id?: string | number;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  mobile?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  storeId?: number;
}
