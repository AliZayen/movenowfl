'use client';

import React, { useEffect } from 'react';
import Icon from '@/app/components/ui/AppIcon';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed bottom-5 right-5 z-50 transition-all duration-300 ${
        message ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-card-foreground shadow-pop">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-success">
          <Icon name="CheckIcon" size={14} />
        </span>
        {message}
      </div>
    </div>
  );
}