import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ROLE } from '@/lib/constants/roles';
import { HashUtils } from '@/lib/utilities/hash.utilities';
import { PrismaService } from '@/prisma/prisma.service';
import { IRegister } from '../user.interface';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const data = {
        firstName: 'test',
        lastName: 'user',
        email: 'test@example.com',
        password: 'password123',
      } satisfies IRegister;
      const hashedPassword = 'hashedPassword';
      const userRole = { id: 'roleId', name: ROLE.USER };
      const createdUser = { id: 'userId', ...data, password: hashedPassword };

      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(userRole as any);
      jest.spyOn(HashUtils, 'hash').mockResolvedValue(hashedPassword);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(createdUser as any);

      const result = await service.createUser(data);

      expect(result).toEqual(createdUser);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: ROLE.USER },
      });
      expect(HashUtils.hash).toHaveBeenCalledWith(data.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...data,
          email: data.email,
          password: hashedPassword,
          userRole: { create: { roleId: userRole.id } },
        },
      });
    });

    it('should throw BadRequestException if user role does not exist', async () => {
      const data = {
        firstName: 'test',
        lastName: 'user',
        email: 'test@example.com',
        password: 'password123',
      } satisfies IRegister;

      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(null);

      await expect(service.createUser(data)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: ROLE.USER },
      });
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      const user = { id: 'userId', email };

      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(user as any);

      const result = await service.findUserByEmail(email);

      expect(result).toEqual(user);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email, deletedAt: null },
      });
    });
  });

  describe('findUserById', () => {
    it('should return a user by id', async () => {
      const id = 'userId';
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        isEmailVerified: true,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user as any);

      const result = await service.findUserById(id);

      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          isEmailVerified: true,
        },
      });
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const id = 'userId';
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@email.com',
      };
      const updatedUser = { id, ...data };

      jest.spyOn(prisma.user, 'update').mockResolvedValue(updatedUser as any);

      const result = await service.updateUser(id, data);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id }, data });
    });
  });
});
