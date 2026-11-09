'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell, { fieldCls, primaryBtn, safeNext } from '@/app/components/AuthShell';
import { OTP_LENGTH, OtpInput, ResendCode, useCountdown } from '@/app/components/OtpInput';
import Icon from '@/app/components/ui/AppIcon';
import { useSession, type CodeStep } from '@/app/components/SessionProvider';
import { api, ApiClientError, errorMessage } from '@/app/lib/api/client';

// signin → (verify if the email isn't confirmed yet)
// signup → verify: 6-digit code from the email, then signed in
// forgot → reset: 6-digit code + new password, then back to signin
// signin as staff → staff: 6-digit code on every sign-in, then /admin
type Mode = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset' | 'staff';

const COPY: Record<Mode, { title: string; subtitle: string; submit: string }> = {
  signin: { title: 'Sign in', subtitle: 'Welcome back. Sign in to manage your bookings.', submit: 'Sign in' },
  signup: { title: 'Create your account', subtitle: 'Book services and track them in one place.', submit: 'Continue' },
  verify: { title: 'Check your email', subtitle: 'Enter the 6-digit code we sent to confirm your email.', submit: 'Verify and continue' },
  forgot: { title: 'Reset your password', subtitle: "Enter your email and we'll send you a 6-digit code.", submit: 'Send code' },
  reset: { title: 'Choose a new password', subtitle: 'Enter the 6-digit code from the email and your new password.', submit: 'Update password' },
  staff: { title: 'Staff sign-in', subtitle: 'Staff accounts need a 6-digit code on every sign-in.', submit: 'Sign in' },
};

const MODES: Mode[] = ['signin', 'signup', 'forgot', 'reset'];

export default function SignInClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { signIn, signUp, verifyEmail, verifyStaff } = useSession();
  const next = safeNext(params.get('next'));
  // Pros land in their own area unless they were heading somewhere specific.
  const landing = (role: string) => (role === 'provider' && !params.get('next') ? '/pro' : next);
  const initialMode = MODES.find((m) => m === params.get('mode')) ?? 'signin';

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  // Opened from Profile or the quote page right after a code was sent: wait before resending.
  const countdown = useCountdown(initialMode === 'reset' && params.get('email') ? 60 : 0);

  const switchMode = (m: Mode, message: string | null = null) => {
    setMode(m);
    setError(null);
    setFields({});
    setNotice(message);
    setCode('');
  };

  const toCodeStep = (m: 'verify' | 'reset' | 'staff', step: Pick<CodeStep, 'message' | 'resendInSec'>) => {
    switchMode(m, step.message);
    setPassword(m === 'reset' ? '' : password);
    setConfirm('');
    countdown.start(step.resendInSec);
  };

  const fail = (err: unknown) => {
    setError(errorMessage(err));
    setFields(err instanceof ApiClientError && err.fields ? err.fields : {});
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      await fn();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const verify = (value = code) =>
    run(async () => {
      if (value.length !== OTP_LENGTH) throw new ApiClientError(400, 'VALIDATION_ERROR', `Enter the ${OTP_LENGTH}-digit code`);
      if (mode === 'staff') {
        await verifyStaff(email, value);
        // Staff land in the admin area unless they were heading somewhere specific.
        router.replace(params.get('next') ? next : '/admin');
        return;
      }
      const verified = await verifyEmail(email, value, remember);
      router.replace(landing(verified.role));
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'verify' || mode === 'staff') return void verify();
    void run(async () => {
      if (mode === 'signin') {
        try {
          const signedIn = await signIn(email, password, remember);
          router.replace(landing(signedIn.role));
        } catch (err) {
          // Right password, email never confirmed: the server just emailed a code.
          if (err instanceof ApiClientError && err.code === 'EMAIL_NOT_VERIFIED') {
            toCodeStep('verify', { message: err.message, resendInSec: 60 });
            return;
          }
          // Staff account: the password was right and a sign-in code is on its way.
          if (err instanceof ApiClientError && err.code === 'MFA_REQUIRED') {
            toCodeStep('staff', { message: err.message, resendInSec: 60 });
            return;
          }
          throw err;
        }
      } else if (mode === 'signup') {
        toCodeStep('verify', await signUp({ email, password, fullName: fullName || undefined, phone: phone || undefined }));
      } else if (mode === 'forgot') {
        toCodeStep('reset', await api<CodeStep>('/auth/password/forgot', { method: 'POST', body: { email } }));
      } else {
        if (password !== confirm) {
          const msg = "The two passwords don't match";
          throw new ApiClientError(400, 'VALIDATION_ERROR', msg, { confirm: msg });
        }
        await api('/auth/password/reset', { method: 'POST', body: { email, code, newPassword: password } });
        setPassword('');
        setConfirm('');
        switchMode('signin', 'Password updated. Sign in with your new password.');
      }
    });
  };

  const resend = async () => {
    setResending(true);
    setError(null);
    try {
      if (mode === 'staff') {
        // A new staff code comes from repeating the password step (kept in memory on this page only).
        try {
          await signIn(email, password, false);
        } catch (err) {
          if (!(err instanceof ApiClientError && err.code === 'MFA_REQUIRED')) throw err;
        }
        setNotice(`We sent a new code to ${email}.`);
        setCode('');
        countdown.start(60);
        return;
      }
      const path = mode === 'reset' ? '/auth/password/forgot' : '/auth/signup/resend';
      const step = await api<CodeStep>(path, { method: 'POST', body: { email } });
      setNotice(`We sent a new code to ${email}.`);
      setCode('');
      countdown.start(step.resendInSec);
    } catch (err) {
      fail(err);
    } finally {
      setResending(false);
    }
  };

  const copy = COPY[mode];
  const codeStep = mode === 'verify' || mode === 'reset' || mode === 'staff';
  const fieldError = (name: string) =>
    fields[name] ? (
      <p id={`${name}-error`} className="mt-1 text-xs text-destructive">
        {fields[name]}
      </p>
    ) : null;

  return (
    <AuthShell title={copy.title} subtitle={copy.subtitle}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && !fields.code && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
            {notice}
          </p>
        )}

        {mode === 'signup' && (
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-foreground">
              Full name
            </label>
            <input id="fullName" autoComplete="name" className={fieldCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
        )}

        {codeStep ? (
          <p className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
            <span className="flex min-w-0 items-center gap-2">
              <Icon name="EnvelopeIcon" size={18} className="shrink-0 text-muted-foreground" />
              <span className="truncate font-semibold">{email}</span>
            </span>
            <button
              type="button"
              onClick={() => switchMode(mode === 'reset' ? 'forgot' : mode === 'staff' ? 'signin' : 'signup')}
              className="shrink-0 text-xs font-semibold text-accent-strong hover:underline"
            >
              Change
            </button>
          </p>
        ) : (
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className={fieldCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fields.email}
              aria-describedby={fields.email ? 'email-error' : undefined}
            />
            {fieldError('email')}
          </div>
        )}

        {codeStep && (
          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium text-foreground">
              6-digit code
            </label>
            <OtpInput
              id="code"
              value={code}
              onChange={setCode}
              onComplete={mode === 'verify' || mode === 'staff' ? (c) => void verify(c) : undefined}
              error={fields.code}
              autoFocus
            />
          </div>
        )}

        {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                {mode === 'reset' ? 'New password' : 'Password'}
              </label>
              {mode === 'signin' && (
                <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-semibold text-accent-strong hover:underline">
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                className={`${fieldCls} pr-11`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!(fields.password || fields.newPassword)}
                aria-describedby={fields.password || fields.newPassword ? 'password-error' : mode !== 'signin' ? 'password-hint' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              >
                <Icon name={showPw ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
              </button>
            </div>
            {mode !== 'signin' && !fields.password && !fields.newPassword && (
              <p id="password-hint" className="mt-1 text-xs text-muted-foreground">
                At least 8 characters, with a letter and a number.
              </p>
            )}
            {(fields.password || fields.newPassword) && (
              <p id="password-error" className="mt-1 text-xs text-destructive">
                {fields.password || fields.newPassword}
              </p>
            )}
          </div>
        )}

        {mode === 'reset' && (
          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-foreground">
              Confirm new password
            </label>
            <input
              id="confirm"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className={fieldCls}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={!!fields.confirm}
              aria-describedby={fields.confirm ? 'confirm-error' : undefined}
            />
            {fieldError('confirm')}
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-foreground">
              Phone <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input id="phone" type="tel" autoComplete="tel" className={fieldCls} value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!fields.phone} />
            {fieldError('phone')}
          </div>
        )}

        {mode === 'signin' && (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[var(--accent-strong)]" />
            Keep me signed in for 30 days
          </label>
        )}

        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? 'Please wait…' : copy.submit}
        </button>

        {codeStep && <ResendCode secondsLeft={countdown.left} busy={resending} onResend={resend} />}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === 'signin' ? (
          <>
            New to MoveNow?{' '}
            <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-accent-strong hover:underline">
              Create an account
            </button>
          </>
        ) : (
          <>
            {mode === 'signup' || mode === 'verify' ? 'Already have an account?' : mode === 'staff' ? 'Wrong account?' : 'Remembered it?'}{' '}
            <button type="button" onClick={() => switchMode('signin')} className="font-semibold text-accent-strong hover:underline">
              Sign in
            </button>
          </>
        )}
      </p>
    </AuthShell>
  );
}
