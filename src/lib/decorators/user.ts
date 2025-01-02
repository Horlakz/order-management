import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    if (data === 'id') return req.user?.sub;

    return req.user;
  },
);

export const WsUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient();

    if (data === 'id') return client.user?.sub;

    return client.user;
  },
);
