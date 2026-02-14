import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';
import { DataProvider } from '@/components/data-provider';

export const metadata: Metadata = {
  title: 'Silverline | Acceptance Test Dashboard',
  description: 'BDD test results visualization for Silverline Software',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <DataProvider>
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
