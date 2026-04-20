import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: { isSystem: true },
    create: { name: 'admin', description: 'مدیر سیستم', isSystem: true },
  });
  const accountantRole = await prisma.role.upsert({
    where: { name: 'accountant' },
    update: { isSystem: true },
    create: { name: 'accountant', description: 'حسابدار', isSystem: true },
  });
  await prisma.role.upsert({
    where: { name: 'employee' },
    update: { isSystem: true },
    create: { name: 'employee', description: 'کارمند', isSystem: true },
  });

  console.log('✅ Roles created');

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@atelier-moein.ir',
      password: hashedPassword,
      role_id: adminRole.id,
    },
  });

  // Create accountant user
  const hashedPassword2 = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { username: 'accountant' },
    update: {},
    create: {
      username: 'accountant',
      email: 'accountant@atelier-moein.ir',
      password: hashedPassword2,
      role_id: accountantRole.id,
    },
  });

  console.log('✅ Users created (admin / password123)');

  // Create initial settings
  const existing = await prisma.settings.findFirst();
  if (!existing) {
    await prisma.settings.create({
      data: { company_name: 'آتلیه معین' },
    });
    console.log('✅ Settings created');
  }

  console.log('🎉 Seed completed!');
  console.log('');
  console.log('Default credentials:');
  console.log('  admin / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
