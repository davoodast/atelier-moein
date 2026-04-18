'use client';

import Header from '@/components/common/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
