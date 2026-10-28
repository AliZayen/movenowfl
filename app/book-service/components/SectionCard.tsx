import React from 'react';
import Icon from '@/app/components/ui/AppIcon';

interface SectionCardProps {
  step: number;
  icon: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function SectionCard({ step, icon, title, subtitle, children }: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <header className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground">
          {step}
        </span>
        <Icon name={icon} size={28} className="mt-1 shrink-0 text-primary" />
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
