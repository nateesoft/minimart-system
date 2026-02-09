import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TranslationProvider } from '@/providers/TranslationProvider';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Minimart POS',
  description: 'Point of Sale System for Retail Stores',
  keywords: ['POS', 'Point of Sale', 'Minimart', 'Retail'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={inter.className}>
        <SettingsProvider>
          <ThemeProvider>
            <TranslationProvider>
              <AuthProvider>{children}</AuthProvider>
            </TranslationProvider>
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
