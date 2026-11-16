import { ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationBodyDto {
  @ApiPropertyOptional()
  id?: string | number;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  severity?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  body?: string;

  @ApiPropertyOptional()
  orderId?: string | number;

  @ApiPropertyOptional()
  href?: string;

  @ApiPropertyOptional()
  hrefLabel?: string;

  @ApiPropertyOptional()
  audience?: string[];

  @ApiPropertyOptional()
  at?: string;

  @ApiPropertyOptional()
  read?: boolean;
}
