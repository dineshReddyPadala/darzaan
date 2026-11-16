import { Body, Controller, Get, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../../libs/common/src/auth-context';
import { CreateUserDto, SetPasswordDto, UpdateUserDto } from './dto';
import { userRoutes } from './routes';
import { UsersService } from './service';

@ApiTags('users')
@ApiBearerAuth()
@Controller(userRoutes.base)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(userRoutes.assistants)
  assistants(@CurrentUser() user: AuthUser) {
    return this.users.assistants(user);
  }

  @Get(userRoutes.users)
  list(@CurrentUser() user: AuthUser) {
    return this.users.list(user);
  }

  @Post(userRoutes.users)
  create(@CurrentUser() user: AuthUser, @Body() body: CreateUserDto) {
    return this.users.create(user, body);
  }

  @Patch(userRoutes.user)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.users.update(user, id, body);
  }

  @Post(userRoutes.password)
  setPassword(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: SetPasswordDto) {
    return this.users.setPassword(user, id, body.password);
  }
}
