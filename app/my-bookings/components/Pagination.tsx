import React from 'react';
import Icon from '@/app/components/ui/AppIcon';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  from: number;
  to: number;
  total: number;
}

export default function Pagination({ page, totalPages, onPage, from, to, total }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="ChevronLeftIcon" size={14} />
        </button>
        {pages.map((p) => (
          <button
            key={`page-${p}`}
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`tabular h-8 min-w-8 rounded-md border px-2 text-xs font-bold transition-all active:scale-95 ${
              p === page
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-card text-primary hover:bg-muted'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          aria-label="Next page"
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="ChevronRightIcon" size={14} />
        </button>
      </div>
      <p className="tabular text-xs text-muted-foreground">
        Showing {from}-{to} of {total} bookings
      </p>
    </div>
  );
}