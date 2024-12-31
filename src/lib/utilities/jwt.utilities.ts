import { sign, verify } from 'jsonwebtoken';

export class JwtUtils {
  private static readonly refreshSecret = process.env.JWT_REFRESH_SECRET;
  private static readonly accessSecret = process.env.JWT_ACCESS_SECRET;

  public static generateToken(
    sub: string,
    secretType: 'access' | 'refresh',
  ): string {
    const secret =
      secretType === 'access' ? this.accessSecret : this.refreshSecret;
    const expiresIn = secretType === 'access' ? '15m' : '7d';
    return sign({ sub }, secret, { expiresIn });
  }

  public static verifyToken(token: string, secretType: 'access' | 'refresh') {
    const secret =
      secretType === 'access' ? this.accessSecret : this.refreshSecret;
    return verify(token, secret);
  }
}
