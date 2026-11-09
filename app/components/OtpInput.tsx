'use client';

import React, { useEffect, useState } from 'react';

export const OTP_LENGTH = 6;

interface OtpInputProps {
  id: string;
  value: string;
  onChange: (code: string) => void;
  /** Called once all digits are in, e.g. to submit right away. */
  onComplete?: (code: string) => void;
  error?: string;
  autoFocus?: boolean;
  className?: string;
}

// One field, not six boxes: paste, phone autofill ("one-time-code") and screen readers all work.
export function OtpInput({ id, value, onChange, onComplete, error, autoFocus, className = '' }: OtpInputProps) {
  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d*"
        maxLength={OTP_LENGTH}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          const code = e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH);
          onChange(code);
          if (code.length === OTP_LENGTH && code !== value) onComplete?.(code);
        }}
        placeholder="••••••"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`tabular h-14 w-full rounded-lg border border-border bg-card text-center text-2xl font-bold tracking-[0.5em] text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive ${className}`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </>
  );
}

/** Seconds left before "Resend code" is allowed again. */
export function useCountdown(initial = 0) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);
  return { left, start: setLeft };
}

interface ResendCodeProps {
  secondsLeft: number;
  busy?: boolean;
  onResend: () => void;
  className?: string;
}

export function ResendCode({ secondsLeft, busy, onResend, className = 'text-muted-foreground' }: ResendCodeProps) {
  const waiting = secondsLeft > 0;
  return (
    <p className={`text-sm ${className}`}>
      Didn&apos;t get it? Check spam, or{' '}
      <button
        type="button"
        onClick={onResend}
        disabled={waiting || busy}
        className="font-semibold text-accent-strong hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
      >
        {busy ? 'sending…' : waiting ? `resend in ${secondsLeft}s` : 'resend the code'}
      </button>
      .
    </p>
  );
}
