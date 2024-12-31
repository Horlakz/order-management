import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';

import { AppUtilities } from '@/lib/utilities/app.utilities';
import { UserService } from './user.service';
import { VerificationCodeService } from './verification-code.service';

describe('VerificationCodeService', () => {
  let service: VerificationCodeService;
  let cacheManager: Cache;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationCodeService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findUserByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VerificationCodeService>(VerificationCodeService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  describe('create', () => {
    it('should create a verification code and store it in cache', async () => {
      const email = 'test@example.com';
      const user = { id: '123', email };
      const code = '123456';

      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue(user as any);
      jest.spyOn(AppUtilities, 'generateRandomNumber').mockReturnValue(code);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.create(email);

      expect(userService.findUserByEmail).toHaveBeenCalledWith(email);
      expect(AppUtilities.generateRandomNumber).toHaveBeenCalledWith(6);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `verification-code:123`,
        code,
        600000,
      );
      expect(result).toBe(code);
    });

    it('should throw BadRequestException if user does not exist', async () => {
      const email = 'test@example.com';

      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue(null);

      await expect(service.create(email)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verify', () => {
    it('should verify the code and delete it from cache', async () => {
      const email = 'test@example.com';
      const user = { id: '123', email };
      const code = '123456';

      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue(user as any);
      jest.spyOn(cacheManager, 'get').mockResolvedValue(code);
      jest.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

      await service.verify(code, email);

      expect(userService.findUserByEmail).toHaveBeenCalledWith(email);
      expect(cacheManager.get).toHaveBeenCalledWith(`verification-code:123`);
      expect(cacheManager.del).toHaveBeenCalledWith(`verification-code:123`);
    });

    it('should throw BadRequestException if user does not exist', async () => {
      const email = 'test@example.com';
      const code = '123456';

      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue(null);

      await expect(service.verify(code, email)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if code is invalid', async () => {
      const email = 'test@example.com';
      const user = { id: '123', email };
      const code = '123456';
      const invalidCode = '654321';

      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue(user as any);
      jest.spyOn(cacheManager, 'get').mockResolvedValue(invalidCode);

      await expect(service.verify(code, email)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
