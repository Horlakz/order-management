import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AppUtilities } from '@/lib/utilities/app.utilities';
import { UserService } from './user.service';

@Injectable()
export class VerificationCodeService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly userService: UserService,
  ) {}

  async create(email: string): Promise<string> {
    const user = await this.userService.findUserByEmail(email);
    this.ensureUserExists(user);

    const code = AppUtilities.generateRandomNumber(6);
    await this.cacheManager.set(this.cacheKey(user.id), code, 600000);

    return code;
  }

  async verify(code: string, email: string): Promise<void> {
    const user = await this.userService.findUserByEmail(email);
    this.ensureUserExists(user);

    const cachedCode = await this.cacheManager.get<string>(
      this.cacheKey(user.id),
    );
    this.ensureCodeIsValid(code, cachedCode);

    await this.cacheManager.del(this.cacheKey(user.id));
  }

  private cacheKey(userId: string): string {
    return `verification-code:${userId}`;
  }

  private ensureUserExists(user: any): void {
    if (!user) {
      throw new BadRequestException('User not found');
    }
  }

  private ensureCodeIsValid(
    code: string,
    cachedCode: string | undefined,
  ): void {
    if (!cachedCode || code !== cachedCode) {
      throw new BadRequestException('Invalid verification code');
    }
  }
}
