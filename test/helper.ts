import { ROLE } from '@/lib/constants/roles';
import { JwtUtils } from '@/lib/utilities/jwt.utilities';
import { PrismaClient } from '@prisma/client';

export async function getAuthToken(db: PrismaClient) {
  const testUser = await db.user.create({
    data: {
      email: 'test@horlakz.com',
      firstName: 'test',
      lastName: 'user',
      password: 'password',
      userRole: { create: { role: { create: { name: ROLE.USER } } } },
    },
  });
  const adminUser = await db.user.create({
    data: {
      email: 'admin@horlakz.com',
      firstName: 'admin',
      lastName: 'user',
      password: 'password',
      userRole: { create: { role: { create: { name: ROLE.ADMIN } } } },
    },
  });

  const user = JwtUtils.generateToken(testUser.id, 'access');
  const admin = JwtUtils.generateToken(adminUser.id, 'access');
  return { user, admin };
}

export async function clearDb(db: PrismaClient) {
  await db.$transaction(async (tx) => {
    await tx.chatRoomParticipant.deleteMany();
    await tx.chatMessage.deleteMany();
    await tx.chatRoom.deleteMany();
    await tx.orderStatusHistory.deleteMany();
    await tx.order.deleteMany();
    await tx.userRole.deleteMany();
    await tx.role.deleteMany();
    await tx.user.deleteMany();
  });
}
