
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default test user (john@doe.com / johndoe123)
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password: hashedPassword,
      isAdmin: true
    }
  });

  console.log('✅ Test admin user created:', testUser.email);

  // Create Classical Hatha Yoga programs
  const program1 = await prisma.program.upsert({
    where: { slug: 'bhuta-shuddhi' },
    update: {},
    create: {
      slug: 'bhuta-shuddhi',
      title: 'Bhuta Shuddhi',
      description: 'Bhuta Shuddhi es un proceso de purificación de los cinco elementos (tierra, agua, fuego, aire y espacio) en el sistema humano. Esta práctica fundamental limpia el sistema elemental y crea las bases para una transformación profunda. Incluye técnicas de respiración, visualización y mantras específicos para cada elemento.',
      durationWeeks: 6,
      priceCents: 12000, // €120.00
      currency: 'EUR',
      isActive: true
    }
  });

  const program2 = await prisma.program.upsert({
    where: { slug: 'yogasanas' },
    update: {},
    create: {
      slug: 'yogasanas',
      title: 'Yogasanas',
      description: 'Las Yogasanas son posturas físicas diseñadas para elevar la conciencia. Este programa enseña 36 asanas poderosas del Hatha Yoga clásico, cada una trabajando sobre aspectos específicos del sistema. Aprende la alineación correcta, la respiración y el enfoque mental necesarios para transformar tu práctica física en una experiencia meditativa.',
      durationWeeks: 12,
      priceCents: 24000, // €240.00
      currency: 'EUR',
      isActive: true
    }
  });

  const program3 = await prisma.program.upsert({
    where: { slug: 'surya-kriya' },
    update: {},
    create: {
      slug: 'surya-kriya',
      title: 'Surya Kriya',
      description: 'Surya Kriya es un proceso energético completo y holístico que se alinea con el sol. Esta práctica milenaria activa el fuego solar dentro del cuerpo, elevando el nivel de energía de forma natural. Es una práctica completa que incluye 21 pasos y trabaja profundamente sobre el sistema energético.',
      durationWeeks: 8,
      priceCents: 16000, // €160.00
      currency: 'EUR',
      isActive: true
    }
  });

  const program4 = await prisma.program.upsert({
    where: { slug: 'angamardana' },
    update: {},
    create: {
      slug: 'angamardana',
      title: 'Angamardana',
      description: 'Angamardana es un sistema de fitness del Hatha Yoga que fortalece todo el cuerpo, especialmente columna, músculos y articulaciones. Esta práctica vigorosa trabaja sin necesidad de equipamiento, usando solo el peso corporal. Revitaliza el cuerpo, aumenta la flexibilidad y desarrolla control mental.',
      durationWeeks: 5,
      priceCents: 10000, // €100.00
      currency: 'EUR',
      isActive: true
    }
  });

  const program5 = await prisma.program.upsert({
    where: { slug: 'surya-shakti' },
    update: {},
    create: {
      slug: 'surya-shakti',
      title: 'Surya Shakti',
      description: 'Surya Shakti es una forma dinámica y activa de practicar con el sol. Esta práctica desarrolla fortaleza física, fitness cardiovascular y poder muscular de forma intensa. Es perfecta para quienes buscan una práctica vigorosa que combine el aspecto físico con la dimensión espiritual del yoga.',
      durationWeeks: 6,
      priceCents: 12000, // €120.00
      currency: 'EUR',
      isActive: true
    }
  });

  console.log('✅ Classical Hatha Yoga programs created');

  // Create sample cohorts
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  const twoMonths = new Date(today);
  twoMonths.setMonth(twoMonths.getMonth() + 2);

  const threeMonths = new Date(today);
  threeMonths.setMonth(threeMonths.getMonth() + 3);

  // Bhuta Shuddhi Cohort
  const cohort1 = await prisma.cohort.create({
    data: {
      programId: program1.id,
      name: 'Bhuta Shuddhi - Primavera 2025',
      startDate: nextMonth,
      endDate: new Date(nextMonth.getTime() + 42 * 24 * 60 * 60 * 1000), // +6 weeks
      maxSeats: 15,
      scheduleText: 'Lunes y Miércoles 18:00-19:30',
      location: 'Online (Zoom)',
      isPublished: true,
      enrollmentOpensAt: today,
      enrollmentClosesAt: new Date(nextMonth.getTime() - 7 * 24 * 60 * 60 * 1000) // 1 week before start
    }
  });

  // Yogasanas Cohort
  const cohort2 = await prisma.cohort.create({
    data: {
      programId: program2.id,
      name: 'Yogasanas - Intensivo Primavera',
      startDate: nextMonth,
      endDate: new Date(nextMonth.getTime() + 84 * 24 * 60 * 60 * 1000), // +12 weeks
      maxSeats: 12,
      scheduleText: 'Martes y Jueves 19:00-20:30',
      location: 'Barcelona - Carrer de Provença 123',
      isPublished: true,
      enrollmentOpensAt: today,
      enrollmentClosesAt: new Date(nextMonth.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  });

  // Surya Kriya Cohort
  const cohort3 = await prisma.cohort.create({
    data: {
      programId: program3.id,
      name: 'Surya Kriya - Edición Verano',
      startDate: twoMonths,
      endDate: new Date(twoMonths.getTime() + 56 * 24 * 60 * 60 * 1000), // +8 weeks
      maxSeats: 15,
      scheduleText: 'Lunes, Miércoles y Viernes 07:00-08:00',
      location: 'Online (Zoom)',
      isPublished: true,
      enrollmentOpensAt: today,
      enrollmentClosesAt: new Date(twoMonths.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  });

  // Angamardana Cohort
  const cohort4 = await prisma.cohort.create({
    data: {
      programId: program4.id,
      name: 'Angamardana - Fortalecimiento Corporal',
      startDate: nextMonth,
      endDate: new Date(nextMonth.getTime() + 35 * 24 * 60 * 60 * 1000), // +5 weeks
      maxSeats: 20,
      scheduleText: 'Sábados 10:00-11:30',
      location: 'Barcelona - Carrer de Balmes 456',
      isPublished: true,
      enrollmentOpensAt: today,
      enrollmentClosesAt: new Date(nextMonth.getTime() - 3 * 24 * 60 * 60 * 1000)
    }
  });

  // Surya Shakti Cohort
  const cohort5 = await prisma.cohort.create({
    data: {
      programId: program5.id,
      name: 'Surya Shakti - Práctica Dinámica',
      startDate: threeMonths,
      endDate: new Date(threeMonths.getTime() + 42 * 24 * 60 * 60 * 1000), // +6 weeks
      maxSeats: 15,
      scheduleText: 'Martes y Jueves 18:30-20:00',
      location: 'Online (Zoom)',
      isPublished: true,
      enrollmentOpensAt: today,
      enrollmentClosesAt: new Date(threeMonths.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('✅ Sample cohorts created');

  // Create weekly session
  const existingSession = await prisma.weeklySession.findFirst();
  if (!existingSession) {
    await prisma.weeklySession.create({
      data: {
        dayOfWeek: 'Miércoles',
        time: '19:00',
        durationHours: 1,
        formUrl: 'https://forms.google.com/tu-formulario-aqui',
        isActive: true
      }
    });
  }

  console.log('✅ Weekly session created');
  console.log('\n📊 Seed Summary:');
  console.log('- Admin user: john@doe.com / johndoe123');
  console.log('- Programs: 5 (Bhuta Shuddhi, Yogasanas, Surya Kriya, Angamardana, Surya Shakti)');
  console.log('- Cohorts: 5 (one per program)');
  console.log('- Weekly Session: 1 (Free intro session every Wednesday)');
  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
