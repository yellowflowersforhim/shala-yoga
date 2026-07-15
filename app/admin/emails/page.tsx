
/**
 * Admin page for managing transactional emails
 * Allows sending reminders and completion emails manually
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import EmailsManager from '@/components/admin/emails-manager';

export const metadata: Metadata = {
  title: 'Gestión de Emails | Admin - Classical Hatha Yoga',
  description: 'Gestiona emails transaccionales del sistema',
};

export default async function AdminEmailsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).isAdmin) {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Emails</h1>
        <p className="text-muted-foreground">
          Envía emails transaccionales manualmente o configura envíos automáticos
        </p>
      </div>

      <EmailsManager />
    </div>
  );
}
