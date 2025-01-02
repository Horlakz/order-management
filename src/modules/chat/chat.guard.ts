import { JwtUtils } from '@/lib/utilities/jwt.utilities';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class WsAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake.headers['authorization'];

    if (!token) return false;

    try {
      const data = JwtUtils.verifyToken(token.split(' ')[1], 'access');
      if (data) {
        client.user = data;
        return true;
      } else return false;
    } catch {
      client.disconnect();

      return false;
    }
  }
}
