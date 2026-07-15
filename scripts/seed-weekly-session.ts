
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding weekly session...');

  // Check if a weekly session already exists
  const existingSession = await prisma.weeklySession.findFirst();

  if (existingSession) {
    console.log('✅ Weekly session already exists, updating...');
    
    await prisma.weeklySession.update({
      where: { id: existingSession.id },
      data: {
        dayOfWeek: 'Miércoles',
        time: '19:00',
        durationHours: 1,
        formUrl: 'https://docs.google.com/forms/d/1PUG-38tqXZToVz94i87u0n-PoG3hGjtGI4NEMP4tBw0/edit',
        isActive: true
      }
    });
    
    console.log('✅ Weekly session updated successfully');
  } else {
    console.log('✅ Creating new weekly session...');
    
    await prisma.weeklySession.create({
      data: {
        dayOfWeek: 'Miércoles',
        time: '19:00',
        durationHours: 1,
        formUrl: 'https://docs.google.com/forms/d/1PUG-38tqXZToVz94i87u0n-PoG3hGjtGI4NEMP4tBw0/edit',
        isActive: true
      }
    });
    
    console.log('✅ Weekly session created successfully');
  }
}

main()
  .catch((e) => {
    console.error('Error seeding weekly session:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
