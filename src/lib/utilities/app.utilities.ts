import { Injectable } from '@nestjs/common';

@Injectable()
export class AppUtilities {
  public static generateRandomNumber(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 1; i <= length; i++) {
      const index = Math.floor(Math.random() * digits.length);
      otp = otp + digits[index];
    }
    return otp;
  }

  public static generateRandomString(length: number = 6): string {
    const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let digit = '';
    for (let i = 1; i <= length; i++) {
      const index = Math.floor(Math.random() * digits.length);
      digit = digit + digits[index];
    }
    return digit;
  }
}
