'use client';

import React, { useRef, useState } from 'react';
import AppImage from '@/app/components/ui/AppImage';
import Icon from '@/app/components/ui/AppIcon';
import ProfileCard from '@/app/profile/components/ProfileCard';
import { OtpInput, ResendCode, useCountdown } from '@/app/components/OtpInput';
import { useSession } from '@/app/components/SessionProvider';
import { api, ApiClientError, errorMessage, upload } from '@/app/lib/api/client';
import { initials } from '@/app/lib/api/format';
import type { ApiUser } from '@/app/lib/api/types';
import { ACCEPTED_IMAGE_TYPES, checkImageFile } from '@/app/lib/uploads';

interface PersonalInfoSectionProps {
  name: string;
  onName: (v: string) => void;
  phone: string;
  onPhone: (v: string) => void;
  email: string;
  emailVerified: boolean;
  avatarUrl: string | null;
  onNotify: (msg: string) => void;
}

const inputCls =
  'h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20';

export default function PersonalInfoSection({ name, onName, phone, onPhone, email, emailVerified, avatarUrl, onNotify }: PersonalInfoSectionProps) {
  const photoRef = useRef<HTMLInputElement>(null);
  const { refresh, setUser } = useSession();
  const [photoBusy, setPhotoBusy] = useState<'upload' | 'remove' | null>(null);
  const [sending, setSending] = useState(false);

  // The new picture shows up everywhere at once (top bar, here) because the session user is updated.
  const changePhoto = async (file: File | undefined) => {
    if (photoRef.current) photoRef.current.value = '';
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) return onNotify(problem);
    setPhotoBusy('upload');
    try {
      const { user } = await upload<{ user: ApiUser }>('/me/avatar', file);
      setUser(user);
      onNotify('Profile photo updated');
    } catch (e) {
      onNotify(errorMessage(e));
    } finally {
      setPhotoBusy(null);
    }
  };

  const removePhoto = async () => {
    setPhotoBusy('remove');
    try {
      const { user } = await api<{ user: ApiUser }>('/me/avatar', { method: 'DELETE' });
      setUser(user);
      onNotify('Profile photo removed');
    } catch (e) {
      onNotify(errorMessage(e));
    } finally {
      setPhotoBusy(null);
    }
  };
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);
  const countdown = useCountdown();

  const sendCode = async () => {
    setSending(true);
    try {
      const res = await api<{ resendInSec?: number }>('/auth/verify-email/resend', { method: 'POST' });
      setCodeSent(true);
      setCode('');
      setCodeError(undefined);
      countdown.start(res.resendInSec ?? 60);
      onNotify(`We sent a 6-digit code to ${email}`);
    } catch (e) {
      onNotify(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const verify = async (value = code) => {
    setVerifying(true);
    setCodeError(undefined);
    try {
      await api('/auth/verify-email', { method: 'POST', body: { code: value } });
      await refresh();
      onNotify('Email confirmed. Thanks!');
    } catch (e) {
      setCodeError(e instanceof ApiClientError && e.fields?.code ? e.fields.code : errorMessage(e));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ProfileCard id="personal" icon="UserIcon" title="Personal Information" subtitle="Update your personal details.">
      {!emailVerified && (
        <div className="mb-5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-foreground">
              <Icon name="EnvelopeIcon" size={18} className="text-warning" /> Please confirm your email address.
            </span>
            {!codeSent && (
              <button type="button" onClick={sendCode} disabled={sending} className="font-semibold text-accent-strong hover:underline disabled:opacity-60">
                {sending ? 'Sending…' : 'Send me a code'}
              </button>
            )}
          </div>
          {codeSent && (
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                void verify();
              }}
            >
              <label htmlFor="verify-code" className="block text-sm font-medium text-foreground">
                Enter the 6-digit code sent to {email}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="sm:w-56">
                  <OtpInput id="verify-code" value={code} onChange={setCode} onComplete={(c) => void verify(c)} error={codeError} autoFocus className="h-11 text-xl" />
                </div>
                <button
                  type="submit"
                  disabled={verifying || code.length !== 6}
                  className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifying ? 'Checking…' : 'Confirm email'}
                </button>
              </div>
              <ResendCode secondsLeft={countdown.left} busy={sending} onResend={sendCode} />
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-32 w-32 overflow-hidden rounded-full bg-primary" aria-busy={!!photoBusy || undefined}>
            {avatarUrl ? (
              <AppImage key={avatarUrl} src={avatarUrl} alt={`${name}'s profile photo`} fill sizes="128px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary-foreground">{initials(name || email)}</span>
            )}
            {photoBusy && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-bold text-white">
                {photoBusy === 'upload' ? 'Uploading…' : 'Removing…'}
              </span>
            )}
          </div>
          <input ref={photoRef} type="file" accept={ACCEPTED_IMAGE_TYPES} className="hidden" onChange={(e) => changePhoto(e.target.files?.[0])} />
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              disabled={!!photoBusy}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-primary transition-colors hover:border-accent hover:text-accent-strong disabled:opacity-60"
            >
              <Icon name="ArrowUpTrayIcon" size={14} /> {avatarUrl ? 'Change Photo' : 'Add Photo'}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={removePhoto}
                disabled={!!photoBusy}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">JPG, PNG or WebP (max 10 MB)</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="full-name" className="mb-1 block text-xs font-medium text-foreground">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input id="full-name" autoComplete="name" className={inputCls} value={name} onChange={(e) => onName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-xs font-medium text-foreground">
                Phone Number
              </label>
              <div className="relative">
                <Icon name="PhoneIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(305) 555-0123"
                  className={`${inputCls} pl-9`}
                  value={phone}
                  onChange={(e) => onPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-foreground">
              Email Address
            </label>
            <div className="relative">
              <Icon name="LockClosedIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                readOnly
                value={email}
                className="h-11 w-full cursor-not-allowed rounded-lg border border-border bg-muted pl-9 pr-3 text-sm text-muted-foreground"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Email address cannot be changed.</p>
          </div>
          <p className="text-xs text-muted-foreground">Your addresses are in Saved Addresses below.</p>
        </div>
      </div>
    </ProfileCard>
  );
}
