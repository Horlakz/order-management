import { PrismaClient } from '@prisma/client';

import { ORDER_STATUS } from '../lib/constants/order-status';
import { ROLE } from '../lib/constants/roles';
import { HashUtils } from '../lib/utilities/hash.utilities';

const prisma = new PrismaClient({ log: ['query'] });

async function seedAdmin() {
  const email = 'admin@checkit.com';
  const passwordHashed = await HashUtils.hash('password');

  const userAdmin = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  await prisma.user.upsert({
    where: { id: userAdmin?.id ?? '00000000-0000-0000-0000-000000000000' },
    update: { password: passwordHashed },
    create: {
      firstName: 'Admin',
      lastName: 'Checkit',
      email,
      isEmailVerified: true,
      password: passwordHashed,
      userRole: { create: { role: { connect: { name: ROLE.ADMIN } } } },
    },
  });
}

async function seedTestUser() {
  const email = 'test@checkit.com';
  const passwordHashed = await HashUtils.hash('password');

  const userTest = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  await prisma.user.upsert({
    where: { id: userTest?.id ?? '00000000-0000-0000-0000-000000000001' },
    update: { password: passwordHashed },
    create: {
      firstName: 'Test',
      lastName: 'Checkit',
      email,
      isEmailVerified: true,
      password: passwordHashed,
      userRole: { create: { role: { connect: { name: ROLE.USER } } } },
    },
  });
}

async function seedRoles() {
  for (const role of Object.values(ROLE)) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }
}

async function seedOrderStatuses() {
  for (const status of Object.values(ORDER_STATUS)) {
    await prisma.orderStatus.upsert({
      where: { name: status },
      update: {},
      create: { name: status },
    });
  }
}

async function main() {
  await seedRoles();
  await seedOrderStatuses();
  await seedAdmin();
  await seedTestUser();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
