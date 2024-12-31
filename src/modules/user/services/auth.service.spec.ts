import { HashUtils } from '@/lib/utilities/hash.utilities';
import { EmailService } from '@/modules/email/email.service';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VerificationCodePurpose } from '../user.interface';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { VerificationCodeService } from './verification-code.service';

describe('AuthService', () => {
  let authService: AuthService;
  let emailService: EmailService;
  let userService: UserService;
  let verificationCodeService: VerificationCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EmailService,
          useValue: {
            sendMailToQueue: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findUserByEmail: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
          },
        },
        {
          provide: VerificationCodeService,
          useValue: {
            create: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    emailService = module.get<EmailService>(EmailService);
    userService = module.get<UserService>(UserService);
    verificationCodeService = module.get<VerificationCodeService>(
      VerificationCodeService,
    );
  });

  describe('login', () => {
    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue(null);

      await expect(
        authService.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if email is not verified', async () => {
      jest
        .spyOn(userService, 'findUserByEmail')
        .mockResolvedValue({ isEmailVerified: false } as any);

      await expect(
        authService.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if password is incorrect', async () => {
      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue({
        isEmailVerified: true,
        password: 'hashedPassword',
      } as any);
      jest.spyOn(HashUtils, 'compareHash').mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return tokens if login is successful', async () => {
      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue({
        id: 'userId',
        isEmailVerified: true,
        password: 'hashedPassword',
      } as any);
      jest.spyOn(HashUtils, 'compareHash').mockResolvedValue(true);
      jest.spyOn(authService, 'generateTokens').mockReturnValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
    });
  });

  describe('register', () => {
    it('should throw BadRequestException if user already exists', async () => {
      jest
        .spyOn(userService, 'findUserByEmail')
        .mockResolvedValue({ email: 'test@example.com' } as any);

      await expect(
        authService.register({
          firstName: 'Test',
          lastName: 'user',
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user and send verification code if registration is successful', async () => {
      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue(null);
      jest.spyOn(userService, 'createUser').mockResolvedValue({} as any);
      jest
        .spyOn(authService, 'sendVerificationCode')
        .mockResolvedValue(undefined);

      await authService.register({
        firstName: 'Test',
        lastName: 'user',
        email: 'test@example.com',
        password: 'password',
      });

      expect(userService.createUser).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'user',
        email: 'test@example.com',
        password: 'password',
      });
      expect(authService.sendVerificationCode).toHaveBeenCalledWith(
        'test@example.com',
        VerificationCodePurpose.CONFIRM_EMAIL,
      );
    });
  });

  describe('sendVerificationCode', () => {
    it('should throw BadRequestException if user is not found', async () => {
      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue(null);

      await expect(
        authService.sendVerificationCode(
          'test@example.com',
          VerificationCodePurpose.CONFIRM_EMAIL,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email is already verified', async () => {
      jest
        .spyOn(userService, 'findUserByEmail')
        .mockResolvedValue({ isEmailVerified: true } as any);

      await expect(
        authService.sendVerificationCode(
          'test@example.com',
          VerificationCodePurpose.CONFIRM_EMAIL,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should send verification code if user is found and email is not verified', async () => {
      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'randomPassword',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      jest
        .spyOn(verificationCodeService, 'create')
        .mockResolvedValue('verificationCode');
      jest.spyOn(emailService, 'sendMailToQueue').mockResolvedValue(undefined);

      await authService.sendVerificationCode(
        'test@example.com',
        VerificationCodePurpose.CONFIRM_EMAIL,
      );

      expect(verificationCodeService.create).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(emailService.sendMailToQueue).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Confirm your email',
        template: VerificationCodePurpose.CONFIRM_EMAIL,
        context: {
          name: 'John Doe',
          code: 'verificationCode',
        },
      });
    });
  });

  // TODO: add more tests
});
