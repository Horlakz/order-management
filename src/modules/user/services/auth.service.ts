import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { HashUtils } from '@/lib/utilities/hash.utilities';
import { JwtUtils } from '@/lib/utilities/jwt.utilities';
import { EmailService } from '@/modules/email/email.service';
import { ILogin, IRegister, VerificationCodePurpose } from '../user.interface';
import { UserService } from './user.service';
import { VerificationCodeService } from './verification-code.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly emailService: EmailService,
    private readonly userService: UserService,
    private readonly verificationCodeService: VerificationCodeService,
  ) {}

  async login(data: ILogin) {
    const user = await this.userService.findUserByEmail(data.email);
    if (!user) throw new NotFoundException('User not found');

    if (!user.isEmailVerified)
      throw new UnauthorizedException('Email is not verified');

    const comparePassword = await HashUtils.compareHash(
      data.password,
      user.password,
    );

    if (!comparePassword) throw new BadRequestException('Invalid credentials');

    return this.generateTokens(user.id);
  }

  refreshTokens(refreshToken: string) {
    const payload = JwtUtils.verifyToken(refreshToken, 'refresh');
    return this.generateTokens(payload.sub as string);
  }

  generateTokens(sub: string) {
    const accessToken = JwtUtils.generateToken(sub, 'access');
    const refreshToken = JwtUtils.generateToken(sub, 'refresh');

    return { accessToken, refreshToken };
  }

  async register(data: IRegister) {
    const user = await this.userService.findUserByEmail(data.email);
    if (user) throw new BadRequestException('User already exists');

    await this.userService.createUser(data);

    await this.sendVerificationCode(
      data.email,
      VerificationCodePurpose.CONFIRM_EMAIL,
    );
  }

  async resendVerificationCode(email: string) {
    await this.sendVerificationCode(
      email,
      VerificationCodePurpose.CONFIRM_EMAIL,
    );
  }

  async sendVerificationCode(email: string, purpose: VerificationCodePurpose) {
    const user = await this.userService.findUserByEmail(email);

    if (!user) throw new BadRequestException('User not found');

    if (
      user.isEmailVerified &&
      purpose == VerificationCodePurpose.CONFIRM_EMAIL
    )
      throw new BadRequestException('Email is already verified');

    const code = await this.verificationCodeService.create(email);

    await this.emailService.sendMailToQueue({
      to: user.email,
      subject:
        purpose == VerificationCodePurpose.CONFIRM_EMAIL
          ? 'Confirm your email'
          : 'Reset your password',
      template: purpose,
      context: {
        name: `${user.firstName} ${user.lastName}`,
        code: code,
      },
    });
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.userService.findUserByEmail(email);

    if (!user) throw new BadRequestException('User not found');

    await this.verificationCodeService.verify(code, email);

    await this.userService.updateUser(user.id, { isEmailVerified: true });
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findUserByEmail(email);

    if (!user) throw new BadRequestException('User not found');

    if (!user.isEmailVerified)
      throw new UnauthorizedException(
        'Email is not verified. Please verify your email',
      );

    await this.sendVerificationCode(
      user.email,
      VerificationCodePurpose.RESET_PASSWORD,
    );
  }

  async resetPassword(email: string, code: string, password: string) {
    const user = await this.userService.findUserByEmail(email);

    if (!user) throw new BadRequestException('User not found');

    if (!user.isEmailVerified)
      throw new UnauthorizedException(
        'Email is not verified. Please verify your email',
      );

    await this.verificationCodeService.verify(code, user.email);

    const hashedPassword = await HashUtils.hash(password);

    await this.userService.updateUser(user.id, { password: hashedPassword });
  }
}
