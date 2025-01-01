import { JwtUtils } from '@/lib/utilities/jwt.utilities';
import { PrismaService } from '@/prisma/prisma.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly db: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake.headers['authorization'];

    if (!token) return false;

    try {
      const userId = JwtUtils.verifyToken(token, 'access');
      if (userId) {
        client.user = userId;
        return true;
      } else return false;
    } catch (err) {
      return false;
    }
  }
}
