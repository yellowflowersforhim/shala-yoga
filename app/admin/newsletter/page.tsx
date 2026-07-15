
import { Metadata } from 'next';
import NewsletterList from '@/components/admin/newsletter-list';

export const metadata: Metadata = {
  title: 'Newsletter - Admin',
  description: 'Gestión de suscriptores del newsletter'
};

export default function NewsletterPage() {
  return <NewsletterList />;
}
