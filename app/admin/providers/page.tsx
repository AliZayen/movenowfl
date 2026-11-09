'use client';

import React, { useState } from 'react';
import Avatar from '@/app/components/ui/Avatar';
import { btnPrimary, btnSecondary, Card, ErrorBox, Field, inputCls, Loading, PageHeader, Pill, useToast } from '@/app/admin/components/ui';
import { useSession } from '@/app/components/SessionProvider';
import { api, ApiClientError, errorMessage, qs, useApi } from '@/app/lib/api/client';
import type { AdminProvider, AdminProviderList } from '@/app/lib/api/types';
import { SERVICE_LABELS, SERVICE_TYPES, type ServiceTypeId } from '@/app/lib/catalog';

type Editing = AdminProvider | 'new' | null;

export default function AdminProvidersPage() {
  const { user } = useSession();
  const canEdit = !!user?.permissions.includes('providers.manage');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | 'true' | 'false'>('');
  const [editing, setEditing] = useState<Editing>(null);
  const { notify, toast } = useToast();
  const { data, error, reload } = useApi<AdminProviderList>(`/admin/providers${qs({ q, active: status })}`);

  return (
    <>
      <PageHeader
        title="Providers"
        subtitle="Pros who can be assigned to jobs. Inactive pros keep their past jobs but get no new ones."
        actions={
          canEdit && (
            <button type="button" onClick={() => setEditing('new')} className={btnPrimary}>
              Add provider
            </button>
          )
        }
      />

      {editing && data && (
        <ProviderForm
          key={editing === 'new' ? 'new' : editing.id}
          provider={editing === 'new' ? null : editing}
          areas={data.areas}
          onCancel={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            notify(msg);
            reload();
          }}
        />
      )}

      <Card>
        <div className="flex flex-wrap gap-3 border-b border-border p-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" aria-label="Search providers" className={`${inputCls} max-w-xs`} />
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status" className={`${inputCls} w-auto`}>
            <option value="">Active and inactive</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>
        {error && <ErrorBox message={error.message} onRetry={reload} />}
        {!data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No providers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Provider</th>
                  <th className="px-3 py-2.5 font-semibold">Services</th>
                  <th className="px-3 py-2.5 font-semibold">Areas</th>
                  <th className="px-3 py-2.5 font-semibold">Open jobs</th>
                  <th className="px-3 py-2.5 font-semibold">Checks</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((p) => (
                  <tr key={p.id} className={p.active ? '' : 'bg-muted/50 text-muted-foreground'}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        {p.avatarUrl ? <Avatar src={p.avatarUrl} alt="" size={36} /> : <span className="h-9 w-9 rounded-full bg-secondary" />}
                        <span>
                          <span className="block font-bold text-foreground">{p.name}</span>
                          <span className="text-xs">
                            {p.phone ?? 'No phone'} · ★ {p.rating.toFixed(1)} ({p.reviewCount})
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3">{p.serviceLabels.join(', ')}</td>
                    <td className="max-w-56 px-3 py-3 text-xs">{p.areas.map((a) => a.name).join(', ') || '—'}</td>
                    <td className="tabular px-3 py-3">{p.openJobs}</td>
                    <td className="space-x-1 px-3 py-3">
                      {!p.active && <Pill tone="danger">Inactive</Pill>}
                      {p.backgroundChecked && <Pill tone="success">Background</Pill>}
                      {p.insured && <Pill tone="success">Insured</Pill>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {canEdit && (
                        <button type="button" onClick={() => setEditing(p)} className="text-sm font-bold text-accent-strong hover:underline">
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {toast}
    </>
  );
}

function ProviderForm({
  provider,
  areas,
  onCancel,
  onSaved,
}: {
  provider: AdminProvider | null;
  areas: { id: string; name: string }[];
  onCancel: () => void;
  onSaved: (msg: string) => void;
}) {
  const [name, setName] = useState(provider?.name ?? '');
  const [phone, setPhone] = useState(provider?.phone ?? '');
  const [services, setServices] = useState<ServiceTypeId[]>(provider?.services ?? []);
  const [areaIds, setAreaIds] = useState<string[]>(provider?.areas.map((a) => a.id) ?? []);
  const [checked, setChecked] = useState(provider?.backgroundChecked ?? false);
  const [insured, setInsured] = useState(provider?.insured ?? false);
  const [active, setActive] = useState(provider?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFields({});
    setError(null);
    const body = { displayName: name, phone: phone.trim() || null, services, areaIds, backgroundChecked: checked, insured, active };
    try {
      if (provider) await api(`/admin/providers/${provider.id}`, { method: 'PATCH', body });
      else await api('/admin/providers', { method: 'POST', body });
      onSaved(provider ? `${name} updated` : `${name} added`);
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiClientError && err.fields) setFields(err.fields);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={provider ? `Edit ${provider.name}` : 'Add a provider'} className="mb-6">
      <form onSubmit={save} className="space-y-4 p-5">
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name" htmlFor="p-name" error={fields.displayName}>
            <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} aria-invalid={!!fields.displayName} />
          </Field>
          <Field label="Phone" htmlFor="p-phone" error={fields.phone} hint="Shown to the customer once a job is confirmed.">
            <input id="p-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} aria-invalid={!!fields.phone} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-foreground">Services</legend>
          <div className="flex flex-wrap gap-3">
            {SERVICE_TYPES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={services.includes(s)} onChange={() => setServices(toggle(services, s))} className="h-4 w-4 accent-[var(--accent-strong)]" />
                {SERVICE_LABELS[s]}
              </label>
            ))}
          </div>
          {fields.services && <p className="mt-1 text-xs text-destructive">{fields.services}</p>}
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-foreground">Service areas</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {areas.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={areaIds.includes(a.id)} onChange={() => setAreaIds(toggle(areaIds, a.id))} className="h-4 w-4 accent-[var(--accent-strong)]" />
                {a.name}
              </label>
            ))}
          </div>
          {fields.areaIds && <p className="mt-1 text-xs text-destructive">{fields.areaIds}</p>}
        </fieldset>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="h-4 w-4 accent-[var(--accent-strong)]" /> Background checked
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={insured} onChange={(e) => setInsured(e.target.checked)} className="h-4 w-4 accent-[var(--accent-strong)]" /> Insured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[var(--accent-strong)]" /> Active (can get new jobs)
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? 'Saving…' : provider ? 'Save changes' : 'Add provider'}
          </button>
          <button type="button" onClick={onCancel} className={btnSecondary}>
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
