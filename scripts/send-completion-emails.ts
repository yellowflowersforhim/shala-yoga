
import { db } from '../lib/db';
import { sendEmail } from '../lib/email';
import { thankYouEmailTemplate } from '../lib/email-templates';

async function sendCompletionEmails() {
  try {
    console.log('🔍 Checking for completed enrollments...');

    // Find enrollments that have just completed (end date was in the last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const completedEnrollments = await db.enrollment.findMany({
      where: {
        status: 'active',
        cohort: {
          endDate: {
            gte: yesterday,
            lte: new Date(),
          },
        },
      },
      include: {
        user: true,
        cohort: {
          include: {
            program: true,
          },
        },
      },
    });

    console.log(`📧 Found ${completedEnrollments.length} enrollments to process`);

    for (const enrollment of completedEnrollments) {
      try {
        // Update enrollment status to completed
        await db.enrollment.update({
          where: { id: enrollment.id },
          data: { status: 'completed' },
        });

        // Send thank you email
        const email = enrollment.user?.email || enrollment.guestEmail;
        const name = enrollment.user?.name || enrollment.guestName || 'Estudiante';

        if (email) {
          await sendEmail({
            to: email,
            subject: `¡Felicidades por completar ${enrollment.cohort.program.title}!`,
            html: thankYouEmailTemplate(name, enrollment.cohort.program.title),
          });

          console.log(`✅ Sent completion email to ${email}`);

          // Create notification for admin
          const admins = await db.user.findMany({
            where: { isAdmin: true },
            select: { id: true },
          });

          for (const admin of admins) {
            await db.notification.create({
              data: {
                userId: admin.id,
                type: 'enrollment_completed',
                title: 'Estudiante completó programa',
                message: `${name} ha completado ${enrollment.cohort.program.title}`,
                link: `/admin/estudiantes/${enrollment.userId}`,
              },
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error processing enrollment ${enrollment.id}:`, error);
      }
    }

    console.log('✅ Completion emails sent successfully');
  } catch (error) {
    console.error('❌ Error sending completion emails:', error);
  } finally {
    await db.$disconnect();
  }
}

sendCompletionEmails();
