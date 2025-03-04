import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import { ReaderViewProvider } from '@/lib/hooks/useReaderView';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Calm New Tab',
  description: 'A clean new tab page with a focus on privacy, simplicity, and customizability.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReaderViewProvider>
            {children}
          </ReaderViewProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}