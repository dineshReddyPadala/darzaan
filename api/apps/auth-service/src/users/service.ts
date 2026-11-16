import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import { AuthService } from '../auth/service';
import type { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly auth: AuthService) {}

  list(actor: AuthUser) {
    return this.auth.listUsers(actor);
  }

  assistants(actor: AuthUser) {
    return this.auth.listProductionAssistants(actor);
  }

  create(actor: AuthUser, body: CreateUserDto) {
    return this.auth.createUser(actor, body);
  }

  update(actor: AuthUser, id: string, body: UpdateUserDto) {
    return this.auth.updateUser(actor, id, body);
  }

  setPassword(actor: AuthUser, id: string, password?: string) {
    return this.auth.setPassword(actor, id, password);
  }
}
