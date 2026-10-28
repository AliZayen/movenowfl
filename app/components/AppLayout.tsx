import React from 'react';
import Topbar from '@/app/components/Topbar';
import NavTabs from '@/app/components/NavTabs';
import Footer from '@/app/components/Footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card shadow-soft">
        <div className="mx-auto w-full max-w-screen-2xl">
          <Topbar />
          <div className="border-t border-border">
            <NavTabs />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 2xl:px-16">{children}</main>
      <Footer />
    </div>
  );
}