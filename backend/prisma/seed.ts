import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Hash password for all test users
  const password = 'Welcome@2026';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create or update CEO user
  const ceo = await prisma.user.upsert({
    where: { email: 'ceo@khygroup.com' },
    update: {},
    create: {
      email: 'ceo@khygroup.com',
      password: hashedPassword,
      name: 'CEO User',
      role: 'CEO',
      status: 'Active',
    },
  });
  console.log('✅ Created CEO:', ceo.email);

  // Create or update Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@khygroup.com' },
    update: {},
    create: {
      email: 'admin@khygroup.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      status: 'Active',
    },
  });
  console.log('✅ Created Admin:', admin.email);

  // Create or update Manager user
  const manager = await prisma.user.upsert({
    where: { email: 'manager@khygroup.com' },
    update: {},
    create: {
      email: 'manager@khygroup.com',
      password: hashedPassword,
      name: 'Manager User',
      role: 'MANAGER',
      status: 'Active',
      teamName: 'Sales Team A',
    },
  });
  console.log('✅ Created Manager:', manager.email);

  // Create or update Sales Executive 1
  const sales1 = await prisma.user.upsert({
    where: { email: 'sales1@khygroup.com' },
    update: {},
    create: {
      email: 'sales1@khygroup.com',
      password: hashedPassword,
      name: 'Sales Executive 1',
      role: 'SALES',
      status: 'Active',
      teamName: 'Sales Team A',
      managerId: manager.id,
    },
  });
  console.log('✅ Created Sales Executive 1:', sales1.email);

  // Create or update Sales Executive 2
  const sales2 = await prisma.user.upsert({
    where: { email: 'sales2@khygroup.com' },
    update: {},
    create: {
      email: 'sales2@khygroup.com',
      password: hashedPassword,
      name: 'Sales Executive 2',
      role: 'SALES',
      status: 'Active',
      teamName: 'Sales Team A',
      managerId: manager.id,
    },
  });
  console.log('✅ Created Sales Executive 2:', sales2.email);

  console.log('\n📊 Seed Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 5 test users created with the following credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔐 All users have password: Welcome@2026\n');
  console.log('1️⃣  CEO:');
  console.log('   Email: ceo@khygroup.com');
  console.log('   Role: CEO (Full system access)\n');

  console.log('2️⃣  Admin:');
  console.log('   Email: admin@khygroup.com');
  console.log('   Role: ADMIN (User management & system settings)\n');

  console.log('3️⃣  Manager:');
  console.log('   Email: manager@khygroup.com');
  console.log('   Role: MANAGER (Team: Sales Team A)\n');

  console.log('4️⃣  Sales Executive 1:');
  console.log('   Email: sales1@khygroup.com');
  console.log('   Role: SALES (Reports to Manager, Team: Sales Team A)\n');

  console.log('5️⃣  Sales Executive 2:');
  console.log('   Email: sales2@khygroup.com');
  console.log('   Role: SALES (Reports to Manager, Team: Sales Team A)\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
