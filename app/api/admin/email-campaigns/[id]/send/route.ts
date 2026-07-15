import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);
    const campaign = await db.emailCampaign.findFirst({
      where: withTenant({ id }, tenant),
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    }

    if (campaign.status !== 'draft') {
      return NextResponse.json({ error: 'Esta campaña ya fue procesada' }, { status: 409 });
    }

    // Atomically claim the campaign to prevent concurrent duplicate sends.
    const claimed = await db.emailCampaign.updateMany({
      where: { id, status: 'draft' },
      data: { status: 'sending' },
    });
    if (claimed.count === 0) {
      return NextResponse.json({ error: 'La campaña ya se está procesando' }, { status: 409 });
    }

    // Get recipients scoped to campaign's tenant
    let recipients: { email: string; name?: string }[] = [];
    const ctid = campaign.tenantId;

    if (campaign.recipientType === 'all_students') {
      const enrollments = await db.enrollment.findMany({
        where: { tenantId: ctid, userId: { not: null }, status: 'active' },
        select: { user: { select: { email: true, name: true } } },
      });
      const seen = new Set<string>();
      recipients = enrollments.filter(e => e.user?.email && !seen.has(e.user.email) && seen.add(e.user.email)).map(e => ({ email: e.user!.email!, name: e.user!.name || undefined }));
    } else if (campaign.recipientType === 'active_students') {
      const activeEnrollments = await db.enrollment.findMany({
        where: { tenantId: ctid, status: 'active' },
        include: { user: { select: { email: true, name: true } } },
      });
      recipients = activeEnrollments
        .filter((e) => e.user?.email)
        .map((e) => ({ email: e.user!.email!, name: e.user!.name || undefined }));
    } else if (campaign.recipientType === 'newsletter_subscribers') {
      const subscribers = await db.newsletterSubscriber.findMany({
        where: { tenantId: ctid, isActive: true },
        select: { email: true, name: true },
      });
      recipients = subscribers.map((s) => ({ email: s.email, name: s.name || undefined }));
    } else if (campaign.recipientType === 'custom' && campaign.recipientIds) {
      const ids = JSON.parse(campaign.recipientIds);
      const users = await db.user.findMany({
        where: { id: { in: ids } },
        select: { email: true, name: true },
      });
      recipients = users.filter((u) => u.email).map((u) => ({ email: u.email!, name: u.name || undefined }));
    }

    // Remove duplicates
    const uniqueRecipients = Array.from(
      new Map(recipients.map((r) => [r.email, r])).values()
    );

    // Send emails
    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of uniqueRecipients) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: campaign.subject,
          html: campaign.content,
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        failedCount++;
      }
    }

    // Update campaign status
    await db.emailCampaign.update({
      where: { id },
      data: {
        status: failedCount === 0 ? 'sent' : 'failed',
        sentCount,
        failedCount,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Campaña enviada correctamente',
      sentCount,
      failedCount,
      totalRecipients: uniqueRecipients.length,
    });
  } catch (error) {
    console.error('Error sending email campaign:', error);
    
    // Update campaign status to failed
    try {
      await db.emailCampaign.update({
        where: { id },
        data: { status: 'failed' },
      });
    } catch (e) {
      console.error('Error updating campaign status:', e);
    }

    return NextResponse.json({ error: 'Error al enviar campaña' }, { status: 500 });
  }
}
