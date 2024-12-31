import { Controller, Get, HttpStatus } from '@nestjs/common';

import { User } from '@/lib/decorators/user';
import { BaseResponse } from '@/lib/payload/response';
import { UserService } from '../services/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUser(@User('id') userId: string) {
    return new BaseResponse(
      HttpStatus.OK,
      'Success',
      await this.userService.findUserById(userId),
    );
  }
}
