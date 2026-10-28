'use client';

import React from 'react';
import Icon from '@/app/components/ui/AppIcon';

interface ProfileCardProps {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function ProfileCard({ id, icon, title, subtitle, action, children }: ProfileCardProps) {
  return (
    <section id={id} className="scroll-mt-40 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <Icon name={icon} size={22} />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
