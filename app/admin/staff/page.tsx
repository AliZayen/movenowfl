'use client';

import React, { useState } from 'react';
import { btnPrimary, btnSecondary, Card, dateTime, ErrorBox, Field, inputCls, Loading, PageHeader, Pill, useToast } from '@/app/admin/components/ui';
import { useSession } from '@/app/components/SessionProvider';
import { api, ApiClientError, errorMessage, useApi } from '@/app/lib/api/client';
import type { AdminStaff, AdminStaffList } from '@/app/lib/api/types';
import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRoleId } from '@/app/lib/staff';

export default function AdminStaffPage() {
  const { user } = useSession();
  const { data, error, reload } = useApi<AdminStaffList>('/admin/staff');
  const [adding, setAdding] = useState(false);
  const { notify, toast } = useToast();

  const update = async (s: AdminStaff, body: { staffRole?: StaffRoleId; disabled?: boolean }, message: string) => {
    try {
      await api(`/admin/staff/${s.id}`, { method: 'PATCH', body });
      notify(message);
      reload();
    } catch (e) {
      notify(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Who can open the admin area and what they can do. Changes sign the person out so they apply right away."
        actions={
          <button type="button" onClick={() => setAdding(true)} className={btnPrimary}>
            Add staff member
          </button>
        }
      />

      <Card className="mb-6">
        <ul className="grid gap-4 p-5 text-sm sm:grid-cols-3">
          {STAFF_ROLES.map((r) => (
            <li key={r}>
              <span className="font-bold text-foreground">{STAFF_ROLE_LABELS[r].label}</span>
              <span className="block text-xs text-muted-foreground">{STAFF_ROLE_LABELS[r].description}</span>
            </li>
          ))}
        </ul>
      </Card>

      {adding && (
        <AddStaff
          onCancel={() => setAdding(false)}
          onAdded={(msg) => {
            setAdding(false);
            notify(msg);
            reload();
          }}
        />
      )}

      <Card>
        {error && <ErrorBox message={error.message} onRetry={reload} />}
        {!data ? (
          <Loading />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Person</th>
                  <th className="px-3 py-2.5 font-semibold">Role</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Last active</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((s) => {
                  const self = s.id === user?.id;
                  return (
                    <tr key={s.id} className={s.disabled ? 'bg-muted/50 text-muted-foreground' : ''}>
                      <td className="px-5 py-3">
                        <span className="block font-bold text-foreground">
                          {s.name} {self && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                        </span>
                        <span className="text-xs">{s.email}</span>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          aria-label={`Role for ${s.name}`}
                          value={s.staffRole ?? ''}
                          disabled={self || s.disabled}
                          onChange={(e) => update(s, { staffRole: e.target.value as StaffRoleId }, `${s.name} is now ${STAFF_ROLE_LABELS[e.target.value as StaffRoleId].label.toLowerCase()}`)}
                          className={`${inputCls} w-36`}
                        >
                          {STAFF_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {STAFF_ROLE_LABELS[r].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="space-x-1 px-3 py-3">
                        {s.disabled ? <Pill tone="danger">No access</Pill> : <Pill tone="success">Active</Pill>}
                        {s.invited && <Pill tone="warning">Hasn&apos;t set a password</Pill>}
                      </td>
                      <td className="px-3 py-3 text-xs">{s.lastActiveAt ? dateTime(s.lastActiveAt) : '—'}</td>
                      <td className="px-5 py-3 text-right">
                        {!self &&
                          (s.disabled ? (
                            <button type="button" onClick={() => update(s, { disabled: false }, `${s.name} can sign in again`)} className="text-sm font-bold text-accent-strong hover:underline">
                              Restore access
                            </button>
                          ) : (
                            <button type="button" onClick={() => update(s, { disabled: true }, `${s.name} was signed out and can no longer sign in`)} className="text-sm font-bold text-destructive hover:underline">
                              Remove access
                            </button>
                          ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {toast}
    </>
  );
}

function AddStaff({ onCancel, onAdded }: { onCancel: () => void; onAdded: (msg: string) => void }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRoleId>('support');
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFields({});
    setError(null);
    try {
      await api('/admin/staff', { method: 'POST', body: { email, fullName, staffRole } });
      onAdded(`Invite sent to ${email}. They choose a password with "Forgot password".`);
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiClientError && err.fields) setFields(err.fields);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Add a staff member" className="mb-6">
      <form onSubmit={submit} className="space-y-4 p-5">
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Full name" htmlFor="s-name" error={fields.fullName}>
            <input id="s-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Work email" htmlFor="s-email" error={fields.email} hint="Must not already be a customer account.">
            <input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Role" htmlFor="s-role">
            <select id="s-role" value={staffRole} onChange={(e) => setStaffRole(e.target.value as StaffRoleId)} className={inputCls}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {STAFF_ROLE_LABELS[r].label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? 'Adding…' : 'Add and send invite'}
          </button>
          <button type="button" onClick={onCancel} className={btnSecondary}>
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
