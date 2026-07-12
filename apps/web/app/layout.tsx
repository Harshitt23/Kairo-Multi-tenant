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
        {/* ambient brand glow behind the app */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              'radial-gradient(60rem 40rem at 80% -10%, rgba(99,102,241,0.12), transparent 60%), radial-gradient(50rem 40rem at 0% 100%, rgba(139,92,246,0.10), transparent 55%)',
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
