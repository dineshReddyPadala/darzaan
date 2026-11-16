import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

export class MessageBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  to!: string;

  @ApiProperty({ enum: ['WhatsApp', 'SMS', 'Email'] })
  @IsIn(['WhatsApp', 'SMS', 'Email'])
  channel!: 'WhatsApp' | 'SMS' | 'Email';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  body!: string;
}
