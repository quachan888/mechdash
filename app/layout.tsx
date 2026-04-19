import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import Providers from '@/components/providers';

export const metadata: Metadata = {
  title: 'Mechanic Dashboard',
  description: 'Track repair orders, hours, and earnings',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className="min-h-screen bg-background antialiased" suppressHydrationWarning>
        <Providers>
          <div className="flex min-h-screen">
            {children}
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
