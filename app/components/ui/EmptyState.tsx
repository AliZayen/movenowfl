import React from 'react';
import Icon from '@/app/components/ui/AppIcon';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'CalendarDaysIcon',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Icon name={icon} size={24} />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-all duration-150 hover:opacity-90 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}