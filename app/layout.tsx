import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import Providers from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { WhatsAppButton } from '@/components/whatsapp-button';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shala — Hatha Yoga Platform',
  description: 'Encuentra tu instructor de Hatha Yoga. Programas intensivos, clases semanales y formación para todos los niveles.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve tenant from host header (server-side)
  let lang = 'es';
  try {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    // Extract locale preference — in production this would query the tenant
    // For now, default to Spanish
  } catch {
    // headers() may not be available in all contexts
  }

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <WhatsAppButton />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
