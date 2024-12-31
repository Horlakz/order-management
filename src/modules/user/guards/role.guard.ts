import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLE } from '@/lib/constants/roles';
import { ISPUBLICKEY } from '@/lib/decorators/public';
import { ISADMINKEY } from '@/lib/decorators/role';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(ISPUBLICKEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const userId = context.switchToHttp().getRequest().user.sub;

    const userRoles = await this.db.userRole.findMany({
      where: { userId },
      select: { role: { select: { name: true } } },
    });

    if (!userRoles) return false;

    const role = this.reflector.getAllAndOverride<keyof typeof ROLE>(
      ISADMINKEY,
      [context.getHandler(), context.getClass()],
    );

    if (role) return userRoles.some((userRole) => userRole.role.name === role);

    return true;
  }
}
