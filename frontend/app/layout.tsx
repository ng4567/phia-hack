import type { Metadata } from 'next';
import { Fraunces, Roboto_Mono } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'phia for stylists',
  description: 'Styled by your stylist, priced by phia.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${GeistSans.variable} ${robotoMono.variable}`}
      style={{ ['--font-geist' as string]: GeistSans.style.fontFamily }}
    >
      <body className="min-h-screen bg-bg-primary text-ink antialiased">{children}</body>
    </html>
  );
}
