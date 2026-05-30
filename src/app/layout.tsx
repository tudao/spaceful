import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Spaceful', template: '%s · Spaceful' },
  description: 'Your personal space on the internet. AI-designed. Uniquely yours.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://spaceful.io'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body style={{ fontFamily: 'var(--font-nunito), var(--font)' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
