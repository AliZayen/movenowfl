'use client';

import React, { useState } from 'react';
import Icon from '@/app/components/ui/AppIcon';
import ProfileCard from '@/app/profile/components/ProfileCard';
import { api, ApiClientError, errorMessage, useApi } from '@/app/lib/api/client';
import type { ApiAddress } from '@/app/lib/api/types';

interface AddressesSectionProps {
  onNotify: (msg: string) => void;
}

interface Draft {
  id?: string; // set when editing
  label: string;
  street: string;
  apt: string;
  city: string;
  zip: string;
}

const blank: Draft = { label: '', street: '', apt: '', city: '', zip: '' };
const iconFor = (label: string | null) => (label === 'Home' ? 'HomeIcon' : label === 'Office' ? 'BriefcaseIcon' : 'MapPinIcon');
const fieldCls =
  'h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive';

// Saved addresses (GET/POST/PATCH/DELETE /me/addresses). They also fill the booking forms' address picker.
export default function AddressesSection({ onNotify }: AddressesSectionProps) {
  const { data, error, reload, mutate } = useApi<{ items: ApiAddress[] }>('/me/addresses');
  const items = data?.items ?? [];
  const [draft, setDraft] = useState<Draft | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setFields({});
    const body = { label: draft.label.trim(), street: draft.street, apt: draft.apt || null, city: draft.city, state: 'FL', zip: draft.zip };
    try {
      if (draft.id) await api(`/me/addresses/${draft.id}`, { method: 'PATCH', body });
      else await api('/me/addresses', { method: 'POST', body });
      setDraft(null);
      reload();
      onNotify(draft.id ? 'Address updated' : 'Address saved');
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setFields(err.fields);
      onNotify(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a: ApiAddress) => {
    try {
      await api(`/me/addresses/${a.id}`, { method: 'DELETE' });
      reload();
      onNotify(`${a.label ?? 'Address'} removed`);
    } catch (err) {
      onNotify(errorMessage(err));
    }
  };

  const makeDefault = async (a: ApiAddress) => {
    try {
      const res = await api<{ items: ApiAddress[] }>(`/me/addresses/${a.id}/default`, { method: 'POST' });
      mutate(res);
      onNotify(`${a.label ?? 'Address'} is now your default`);
    } catch (err) {
      onNotify(errorMessage(err));
    }
  };

  const input = (name: keyof Draft, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`addr-${name}`} className="mb-1 block text-xs font-medium text-foreground">
        {label}
      </label>
      <input
        id={`addr-${name}`}
        className={fieldCls}
        value={draft?.[name] ?? ''}
        aria-invalid={!!fields[name]}
        onChange={(e) => setDraft((d) => (d ? { ...d, [name]: name === 'zip' ? e.target.value.replace(/\D/g, '') : e.target.value } : d))}
        {...props}
      />
      {fields[name] && <p className="mt-1 text-[11px] text-destructive">{fields[name]}</p>}
    </div>
  );

  return (
    <ProfileCard
      id="addresses"
      icon="MapPinIcon"
      title="Saved Addresses"
      subtitle="Manage your frequently used addresses."
      action={
        !draft && (
          <button
            type="button"
            onClick={() => {
              setFields({});
              setDraft({ ...blank });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-strong px-4 py-2 text-xs font-bold text-accent-foreground transition-all hover:opacity-90 active:scale-95"
          >
            <Icon name="PlusIcon" size={14} /> Add New Address
          </button>
        )
      }
    >
      {draft && (
        <form onSubmit={save} className="mb-4 rounded-lg border border-border bg-secondary/40 p-4">
          <p className="mb-3 text-sm font-bold text-foreground">{draft.id ? 'Edit address' : 'New address'}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
            <div className="sm:col-span-2">{input('label', 'Label', { placeholder: 'Home, Office…', required: true })}</div>
            <div className="sm:col-span-4">{input('street', 'Street address', { autoComplete: 'street-address', required: true })}</div>
            <div className="sm:col-span-2">{input('apt', 'Apt / suite (optional)')}</div>
            <div className="sm:col-span-2">{input('city', 'City', { autoComplete: 'address-level2', required: true })}</div>
            <div className="sm:col-span-2">{input('zip', 'ZIP code', { inputMode: 'numeric', maxLength: 5, autoComplete: 'postal-code', required: true })}</div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setDraft(null)} className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {busy ? 'Saving…' : 'Save address'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="mb-3 text-sm text-destructive">
          {error.message}{' '}
          <button type="button" onClick={reload} className="font-semibold underline">
            Try again
          </button>
        </p>
      )}

      <ul className="space-y-2" aria-busy={!data}>
        {items.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
            <Icon name={iconFor(a.label)} size={22} className="shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {a.label}
                {a.isDefault && <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-strong">Default</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">{a.formatted}</p>
            </div>
            {!a.isDefault && (
              <button type="button" onClick={() => makeDefault(a)} className="hidden rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-secondary sm:block">
                Make default
              </button>
            )}
            <button
              type="button"
              aria-label={`Edit ${a.label}`}
              onClick={() => {
                setFields({});
                setDraft({ id: a.id, label: a.label ?? '', street: a.street, apt: a.apt ?? '', city: a.city, zip: a.zip });
              }}
              className="rounded-md p-2 text-primary hover:bg-secondary"
            >
              <Icon name="PencilIcon" size={16} />
            </button>
            <button type="button" aria-label={`Delete ${a.label}`} onClick={() => remove(a)} className="rounded-md p-2 text-primary hover:bg-secondary hover:text-destructive">
              <Icon name="TrashIcon" size={16} />
            </button>
          </li>
        ))}
        {data && items.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No saved addresses yet.</li>
        )}
      </ul>
    </ProfileCard>
  );
}
