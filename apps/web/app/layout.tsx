import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../lib/providers';

export const metadata: Metadata = {
  title: 'Kairo — Project Management',
  description: 'Multi-tenant project management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
