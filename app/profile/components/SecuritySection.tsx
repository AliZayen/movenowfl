'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/app/components/ui/AppIcon';
import ProfileCard from '@/app/profile/components/ProfileCard';
import { api, ApiClientError, errorMessage } from '@/app/lib/api/client';

interface SecuritySectionProps {
  email: string;
  onNotify: (msg: string) => void;
}

interface PwFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  error?: string;
}

function PwField({ id, label, value, onChange, placeholder, autoComplete, error }: PwFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-card px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive"
        />
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
        >
          <Icon name={show ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[11px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default function SecuritySection({ email, onNotify }: SecuritySectionProps) {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const mismatch = confirm.length > 0 && next !== confirm;

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch || !current || !next) return;
    setBusy(true);
    setFields({});
    try {
      await api('/auth/password/change', { method: 'POST', body: { currentPassword: current, newPassword: next } });
      setCurrent('');
      setNext('');
      setConfirm('');
      onNotify('Password updated. Other devices have been signed out.');
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setFields(err.fields);
      onNotify(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Emails a 6-digit code, then opens the page where it's entered with the new password.
  const forgot = async () => {
    try {
      await api('/auth/password/forgot', { method: 'POST', body: { email } });
      router.push(`/signin?mode=reset&email=${encodeURIComponent(email)}`);
    } catch (err) {
      onNotify(errorMessage(err));
    }
  };

  return (
    <ProfileCard id="security" icon="ShieldCheckIcon" title="Security & Password" subtitle="Keep your account secure.">
      <form onSubmit={change}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PwField id="pw-current" label="Current Password" value={current} onChange={setCurrent} placeholder="Current password" autoComplete="current-password" error={fields.currentPassword} />
          <PwField id="pw-new" label="New Password" value={next} onChange={setNext} placeholder="Enter new password" autoComplete="new-password" error={fields.newPassword} />
          <PwField
            id="pw-confirm"
            label="Confirm Password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Confirm new password"
            autoComplete="new-password"
            error={mismatch ? 'Passwords do not match.' : undefined}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={forgot} className="text-xs font-semibold text-accent-strong hover:underline">
            Forgot your password?
          </button>
          <button
            type="submit"
            disabled={busy || mismatch || !current || !next || !confirm}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </ProfileCard>
  );
}
