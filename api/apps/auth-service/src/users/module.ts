import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/module';
import { UsersController } from './controller';
import { UsersService } from './service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
