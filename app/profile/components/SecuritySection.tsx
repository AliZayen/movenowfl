'use client';

import React, { useState } from 'react';
import Icon from '@/app/components/ui/AppIcon';
import ProfileCard from '@/app/profile/components/ProfileCard';

interface SecuritySectionProps {
  onNotify: (msg: string) => void;
}

interface PwFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

function PwField({ id, label, value, onChange, placeholder }: PwFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-card px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
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
    </div>
  );
}

export default function SecuritySection({ onNotify }: SecuritySectionProps) {
  const [current, setCurrent] = useState('password1');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && next !== confirm;

  return (
    <ProfileCard id="security" icon="ShieldCheckIcon" title="Security & Password" subtitle="Keep your account secure.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <PwField id="pw-current" label="Current Password" value={current} onChange={setCurrent} placeholder="Current password" />
        <PwField id="pw-new" label="New Password" value={next} onChange={setNext} placeholder="Enter new password" />
        <div>
          <PwField id="pw-confirm" label="Confirm Password" value={confirm} onChange={setConfirm} placeholder="Confirm new password" />
          {mismatch && <p className="mt-1 text-[11px] text-destructive">Passwords do not match.</p>}
        </div>
      </div>
      <div className="mt-3 text-right">
        <button
          type="button"
          onClick={() => onNotify('Password reset link sent to john@example.com')}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Forgot your password?
        </button>
      </div>
    </ProfileCard>
  );
}
