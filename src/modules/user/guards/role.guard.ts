import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLE } from '@/lib/constants/roles';
import { ISPUBLICKEY } from '@/lib/decorators/public';
import { ISADMINKEY } from '@/lib/decorators/role';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) return true;

    const userId = this.getUserId(context);
    const requiredRole = this.getRequiredRole(context);

    if (requiredRole) {
      return this.hasUserRole(userId, requiredRole);
    }

    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(ISPUBLICKEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  private getUserId(context: ExecutionContext): string {
    return context.switchToHttp().getRequest().user.sub;
  }

  private getRequiredRole(
    context: ExecutionContext,
  ): keyof typeof ROLE | undefined {
    return this.reflector.getAllAndOverride<keyof typeof ROLE>(ISADMINKEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  private async hasUserRole(
    userId: string,
    role: keyof typeof ROLE,
  ): Promise<boolean> {
    const userRoles = await this.db.userRole.findMany({
      where: { userId },
      select: { role: { select: { name: true } } },
    });

    if (!userRoles) return false;

    return userRoles.some((userRole) => userRole.role.name === role);
  }
}
