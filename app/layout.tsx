import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";
import SiteNav from './_components/SiteNav';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NCIMUN Registration',
  description: 'Official registration portal for NCIMUN',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-ncimun-blue text-ncimun-gray`}>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}