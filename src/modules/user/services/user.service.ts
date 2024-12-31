import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { ROLE } from '@/lib/constants/roles';
import { HashUtils } from '@/lib/utilities/hash.utilities';
import { PrismaService } from '@/prisma/prisma.service';
import { IRegister } from '../user.interface';

@Injectable()
export class UserService {
  constructor(private db: PrismaService) {}

  async createUser(data: IRegister) {
    const { password, ...restData } = data;

    const userRole = await this.db.role.findUnique({
      where: { name: ROLE.USER },
    });

    if (!userRole) throw new BadRequestException("user role doesn't exist");

    return await this.db.user.create({
      data: {
        ...restData,
        password: await HashUtils.hash(password),
        userRole: { create: { roleId: userRole.id } },
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.db.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findUserById(id: string) {
    const user = this.db.user.findUnique({
      where: { id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        isEmailVerified: true,
      },
    });

    return user;
  }

  async updateUser(id: string, data: Partial<User>) {
    return this.db.user.update({ where: { id }, data });
  }
}
