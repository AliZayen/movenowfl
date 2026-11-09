'use client';

import React, { useEffect, useState } from 'react';
import Icon from '@/app/components/ui/AppIcon';
import { api, errorMessage } from '@/app/lib/api/client';
import { durationLabel, money } from '@/app/lib/api/format';
import type { ApiEstimate } from '@/app/lib/api/types';

interface State {
  key: string | null;
  data?: ApiEstimate;
  error?: string;
}

/**
 * Live price from POST /quotes/estimate. `payload` is the same body the booking will be created with,
 * or null while required fields are still missing. Requests are debounced while the user types.
 */
export default function EstimateCard({ payload, missing }: { payload: object | null; missing?: string }) {
  const key = payload ? JSON.stringify(payload) : null;
  const [state, setState] = useState<State>({ key: null });

  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      api<ApiEstimate>('/quotes/estimate', { method: 'POST', body: JSON.parse(key), signal: ctrl.signal }).then(
        (data) => setState({ key, data }),
        (e) => e?.name !== 'AbortError' && setState({ key, error: errorMessage(e) }),
      );
    }, 400);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [key]);

  const loading = !!key && state.key !== key;
  const shown = state.data;

  return (
    <section aria-live="polite" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Icon name="CurrencyDollarIcon" size={22} className="text-primary" /> Estimated price
        </h2>
        {loading && <span className="text-xs text-muted-foreground">Updating…</span>}
      </div>

      {!key && <p className="mt-3 text-sm text-muted-foreground">{missing ?? 'Fill in the details to see a price.'}</p>}
      {key && state.key === key && state.error && <p className="mt-3 text-sm font-medium text-destructive">{state.error}</p>}
      {key && shown && !(state.key === key && state.error) && (
        <div className={loading ? 'opacity-60' : ''}>
          <p className="tabular mt-3 text-3xl font-extrabold text-foreground">{money(shown.quotedPriceCents)}</p>
          <p className="text-xs text-muted-foreground">
            About {durationLabel(shown.estimatedDurationMin)} · {shown.area}
          </p>
          <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
            {shown.lines.map((l) => (
              <li key={l.label} className="flex justify-between gap-3 text-muted-foreground">
                <span>{l.label}</span>
                <span className="tabular text-foreground">{money(l.cents)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Your pro confirms the final price before the job starts.</p>
        </div>
      )}
    </section>
  );
}
