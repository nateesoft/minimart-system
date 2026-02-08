import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Minimart POS - ระบบขายหน้าร้าน',
  description: 'ระบบ Point of Sale สำหรับร้านค้าปลีก (Minimart) พร้อมระบบสแกนบาร์โค้ด',
  keywords: ['POS', 'Point of Sale', 'Minimart', 'ระบบขายหน้าร้าน', 'ร้านค้าปลีก'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
