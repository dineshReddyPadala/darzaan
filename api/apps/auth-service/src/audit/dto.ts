import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuditQueryDto {
  @ApiPropertyOptional({ description: 'Opaque cursor from the previous page, `createdAt|id`.' })
  cursor?: string;

  @ApiPropertyOptional({ description: 'Page size, default 50, maximum 100.' })
  take?: number;
}
