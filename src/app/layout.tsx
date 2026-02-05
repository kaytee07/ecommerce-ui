import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: {
    default: 'Worldg3nius',
    template: '%s | World Genius',
  },
  description: 'Your destination for premium products and exceptional quality.',
  keywords: ['e-commerce', 'shopping', 'premium', 'products'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
