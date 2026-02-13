import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Hash password for all test users
  const password = 'Pass123$1';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create or update CEO user
  const ceo = await prisma.user.upsert({
    where: { email: 'ceo@kh3group.com' },
    update: {},
    create: {
      email: 'ceo@kh3group.com',
      password: hashedPassword,
      name: 'CEO User',
      role: 'CEO',
      status: 'Active',
      isEmailVerified: true,
    },
  });
  console.log('✅ Created CEO:', ceo.email);

  // Create or update Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kh3group.com' },
    update: {},
    create: {
      email: 'admin@kh3group.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      status: 'Active',
      isEmailVerified: true,
    },
  });
  console.log('✅ Created Admin:', admin.email);

  // Create or update Manager user
  const manager = await prisma.user.upsert({
    where: { email: 'manager@kh3group.com' },
    update: {},
    create: {
      email: 'manager@kh3group.com',
      password: hashedPassword,
      name: 'Manager User',
      role: 'MANAGER',
      status: 'Active',
      isEmailVerified: true,
    },
  });
  console.log('✅ Created Manager:', manager.email);

  // Create or update Manager 2 (Team B)
  const manager2 = await prisma.user.upsert({
    where: { email: 'manager2@kh3group.com' },
    update: {},
    create: {
      email: 'manager2@kh3group.com',
      password: hashedPassword,
      name: 'Manager 2',
      role: 'MANAGER',
      status: 'Active',
      isEmailVerified: true,
    },
  });
  console.log('✅ Created Manager 2:', manager2.email);

  // Create Teams
  const teamA = await prisma.team.upsert({
    where: { id: 'seed-team-a' },
    update: { managerId: manager.id },
    create: {
      id: 'seed-team-a',
      name: 'Sales Team A',
      description: 'Primary sales team',
      type: 'SALES',
      managerId: manager.id,
    },
  });
  console.log('✅ Created Team:', teamA.name);

  const teamB = await prisma.team.upsert({
    where: { id: 'seed-team-b' },
    update: { managerId: manager2.id },
    create: {
      id: 'seed-team-b',
      name: 'Sales Team B',
      description: 'Secondary sales team',
      type: 'SALES',
      managerId: manager2.id,
    },
  });
  console.log('✅ Created Team:', teamB.name);

  // Assign managers to their teams
  await prisma.user.update({
    where: { id: manager.id },
    data: { teamId: teamA.id, teamName: 'Sales Team A' },
  });
  await prisma.user.update({
    where: { id: manager2.id },
    data: { teamId: teamB.id, teamName: 'Sales Team B' },
  });

  // Create or update Sales user (Team A)
  const sales1 = await prisma.user.upsert({
    where: { email: 'sales@kh3group.com' },
    update: { teamId: teamA.id, teamName: 'Sales Team A', managerId: manager.id },
    create: {
      email: 'sales@kh3group.com',
      password: hashedPassword,
      name: 'Sales Executive 1',
      role: 'SALES',
      status: 'Active',
      isEmailVerified: true,
      teamName: 'Sales Team A',
      teamId: teamA.id,
      managerId: manager.id,
    },
  });
  console.log('✅ Created Sales 1 (Team A):', sales1.email);

  // Create or update Sales 2 (Team B)
  const sales2 = await prisma.user.upsert({
    where: { email: 'sales2@kh3group.com' },
    update: { teamId: teamB.id, teamName: 'Sales Team B', managerId: manager2.id },
    create: {
      email: 'sales2@kh3group.com',
      password: hashedPassword,
      name: 'Sales Executive 2',
      role: 'SALES',
      status: 'Active',
      isEmailVerified: true,
      teamName: 'Sales Team B',
      teamId: teamB.id,
      managerId: manager2.id,
    },
  });
  console.log('✅ Created Sales 2 (Team B):', sales2.email);

  // Create or update Sales 3 (Team B)
  const sales3 = await prisma.user.upsert({
    where: { email: 'sales3@kh3group.com' },
    update: { teamId: teamB.id, teamName: 'Sales Team B', managerId: manager2.id },
    create: {
      email: 'sales3@kh3group.com',
      password: hashedPassword,
      name: 'Sales Executive 3',
      role: 'SALES',
      status: 'Active',
      isEmailVerified: true,
      teamName: 'Sales Team B',
      teamId: teamB.id,
      managerId: manager2.id,
    },
  });
  console.log('✅ Created Sales 3 (Team B):', sales3.email);

  console.log('\n📊 Seed Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 7 test users created with the following credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔐 All users have password: Pass123$1\n');
  console.log('1️⃣  CEO:');
  console.log('   Email: ceo@kh3group.com');
  console.log('   Role: CEO (Full system access)\n');

  console.log('2️⃣  Admin:');
  console.log('   Email: admin@kh3group.com');
  console.log('   Role: ADMIN (User management & system settings)\n');

  console.log('3️⃣  Manager (Team A):');
  console.log('   Email: manager@kh3group.com');
  console.log('   Role: MANAGER (Team: Sales Team A)\n');

  console.log('4️⃣  Sales Executive 1 (Team A):');
  console.log('   Email: sales@kh3group.com');
  console.log('   Role: SALES (Reports to Manager, Team: Sales Team A)\n');

  console.log('5️⃣  Manager 2 (Team B):');
  console.log('   Email: manager2@kh3group.com');
  console.log('   Role: MANAGER (Team: Sales Team B)\n');

  console.log('6️⃣  Sales Executive 2 (Team B):');
  console.log('   Email: sales2@kh3group.com');
  console.log('   Role: SALES (Reports to Manager 2, Team: Sales Team B)\n');

  console.log('7️⃣  Sales Executive 3 (Team B):');
  console.log('   Email: sales3@kh3group.com');
  console.log('   Role: SALES (Reports to Manager 2, Team: Sales Team B)\n');

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
