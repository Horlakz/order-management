import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ILogin, IRegister, IVerifyEmail } from './user.interface';

export class LoginDto implements ILogin {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto extends LoginDto implements IRegister {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  referralCode: string;
}

export class VerifyEmailDto implements IVerifyEmail {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(4)
  code: string;
}

export class ResetEmailDto extends VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class EmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
