'use client';

import { useApi } from '@/app/lib/api/client';
import { money } from '@/app/lib/api/format';
import type { ApiAddress, ApiService, ApiServiceArea } from '@/app/lib/api/types';
import type { ServiceTypeId } from '@/app/lib/catalog';

/** "From $70" labels keyed by service id, from GET /services. Empty until loaded. */
export function useServicePrices(): Partial<Record<ServiceTypeId, string>> {
  const { data } = useApi<{ items: ApiService[] }>('/services');
  return Object.fromEntries((data?.items ?? []).map((s) => [s.id, `From ${money(s.startingPriceCents)}`]));
}

export function useServiceAreas() {
  const { data } = useApi<{ items: ApiServiceArea[] }>('/service-areas');
  return data?.items ?? null;
}

/** Saved addresses for the booking forms' address picker. Pass false to skip (signed out). */
export function useSavedAddresses(enabled = true) {
  const { data } = useApi<{ items: ApiAddress[] }>(enabled ? '/me/addresses' : null);
  return data?.items ?? [];
}
