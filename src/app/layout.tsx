import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';
import { DataProvider } from '@/components/data-provider';
import { ErrorBoundary } from '@/components/error-boundary';

export const metadata: Metadata = {
  title: 'Silverline | Acceptance Test Dashboard',
  description: 'BDD test results visualization for Silverline Software',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ErrorBoundary>
          <ThemeProvider>
            <DataProvider>
              <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
                Skip to content
              </a>
              <Header />
              <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
            </DataProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
