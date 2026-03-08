const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const parentHash = await bcrypt.hash('password123', 12);
  const childHash = await bcrypt.hash('password123', 12);

  // Create parent
  const parent = await prisma.user.upsert({
    where: { email: 'parent@demo.com' },
    update: {},
    create: {
      name: 'Demo Parent',
      email: 'parent@demo.com',
      phone: '+1234567890',
      passwordHash: parentHash,
      role: 'parent',
    },
  });

  // Create child with pair code
  const child = await prisma.user.upsert({
    where: { email: 'child@demo.com' },
    update: {},
    create: {
      name: 'Demo Child',
      email: 'child@demo.com',
      phone: '+1234567891',
      passwordHash: childHash,
      role: 'child',
      pairCode: 'DEMO01',
    },
  });

  // Pair them (both sides)
  await prisma.user.update({
    where: { id: child.id },
    data: { pairedWith: parent.id, pairCode: null },
  });
  await prisma.user.update({
    where: { id: parent.id },
    data: { pairedWith: child.id },
  });

  // Seed a geofence (Home zone)
  await prisma.geofence.upsert({
    where: { id: 'seed-geofence-1' },
    update: {},
    create: {
      id: 'seed-geofence-1',
      parentId: parent.id,
      childId: child.id,
      label: 'Home Zone',
      centerLat: 28.6139,
      centerLng: 77.2090,
      radiusM: 500,
      isActive: true,
    },
  });

  // Seed a reminder
  const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  await prisma.reminder.create({
    data: {
      createdById: parent.id,
      targetId: child.id,
      title: 'Come home by 6 PM',
      body: 'Please be home before dinner!',
      remindAt: futureDate,
    },
  });

  console.log('Seed complete!');
  console.log('Parent login: parent@demo.com / password123');
  console.log('Child login:  child@demo.com  / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
