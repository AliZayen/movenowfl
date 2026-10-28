import React from 'react';
import { PHONE_PRIMARY } from '@/app/lib/contact';

// Slim footer for signed-in pages. The marketing footer stays on the public site.
export default function AppFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 2xl:px-16">
        <p>© MoveNow Miami</p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href={PHONE_PRIMARY.href} className="hover:text-foreground">
            Help: {PHONE_PRIMARY.display}
          </a>
          <a href="#" className="hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground">
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}
