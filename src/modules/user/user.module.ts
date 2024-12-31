import { Module } from '@nestjs/common';

import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { VerificationCodeService } from './services/verification-code.service';

@Module({
  controllers: [UserController, AuthController],
  providers: [UserService, AuthService, VerificationCodeService],
})
export class UserModule {}
