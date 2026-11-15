import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../lib/providers';

export const metadata: Metadata = {
  title: 'Kairo — Project Management',
  description: 'Multi-tenant project management',
};

// Runs before paint so a saved dark preference never flashes light.
const themeInit = `(function(){try{var t=localStorage.getItem('kairo-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
