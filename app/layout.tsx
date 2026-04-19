import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'آتلیه معین',
  description: 'سیستم مدیریت آتلیه عکاسی و فیلمبرداری عروسی',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'آتلیه معین',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
          <Toaster richColors position="top-center" dir="rtl" />
        </ThemeProvider>
      </body>
    </html>
  );
}
