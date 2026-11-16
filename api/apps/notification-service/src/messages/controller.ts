import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MessageBodyDto } from './dto';
import { messageRoutes } from './routes';
import { MessagesService } from './service';

@ApiTags('messages')
@ApiBearerAuth()
@Controller(messageRoutes.base)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post(messageRoutes.messages)
  send(@Body() body: MessageBodyDto) {
    return this.messages.send(body);
  }
}
