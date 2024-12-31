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
    where: { id: userAdmin.id },
    update: { password: passwordHashed },
    create: {
      firstName: 'Admin',
      lastName: 'Checkit',
      email,
      password: passwordHashed,
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
  await seedAdmin();
  await seedRoles();
  await seedOrderStatuses();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
