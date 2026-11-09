'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/app/components/ui/Toast';
import { useSession } from '@/app/components/SessionProvider';
import SettingsSidebar from '@/app/profile/components/SettingsSidebar';
import PersonalInfoSection from '@/app/profile/components/PersonalInfoSection';
import AddressesSection from '@/app/profile/components/AddressesSection';
import LanguageSection, { LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from '@/app/profile/components/LanguageSection';
import NotificationsSection, { NotificationPrefs } from '@/app/profile/components/NotificationsSection';
import SecuritySection from '@/app/profile/components/SecuritySection';
import PaymentSection from '@/app/profile/components/PaymentSection';
import AppearanceSection from '@/app/profile/components/AppearanceSection';
import { api, errorMessage } from '@/app/lib/api/client';
import type { ApiUser } from '@/app/lib/api/types';

// RequireAuth (AppLayout) renders this only once the session has loaded, so `user` is set.
export default function ProfileClient() {
  const router = useRouter();
  const { user, setUser } = useSession();
  const u = user!;
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const [active, setActive] = useState('personal');
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(u.fullName);
  const [phone, setPhone] = useState(u.phone ?? '');
  const [language, setLanguage] = useState(u.preferences.language);
  const [timezone, setTimezone] = useState(u.preferences.timezone);
  const [dateFormat, setDateFormat] = useState(u.preferences.dateFormat);
  const [prefs, setPrefs] = useState<NotificationPrefs>(u.preferences.notifications);
  const [theme, setTheme] = useState(u.preferences.theme);

  const handleSelect = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setToast('Please enter your full name');
      return;
    }
    setSaving(true);
    try {
      await api<{ user: ApiUser }>('/me', { method: 'PATCH', body: { fullName: name.trim(), phone: phone.trim() || null } });
      const { user: updated } = await api<{ user: ApiUser }>('/me/preferences', {
        method: 'PATCH',
        body: { language, timezone, dateFormat, theme, notifications: prefs },
      });
      setUser(updated);
      setPhone(updated.phone ?? '');
      setToast('Your changes have been saved');
    } catch (e) {
      setToast(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      <SettingsSidebar active={active} onSelect={handleSelect} />
      <div className="min-w-0 space-y-5">
        <PersonalInfoSection
          name={name}
          onName={setName}
          phone={phone}
          onPhone={setPhone}
          email={u.email}
          emailVerified={u.emailVerified}
          avatarUrl={u.avatarUrl}
          onNotify={setToast}
        />
        <AddressesSection onNotify={setToast} />
        <NotificationsSection prefs={prefs} onChange={setPrefs} />
        <SecuritySection email={u.email} onNotify={setToast} />

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:border-accent hover:text-accent-strong active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-w-48 rounded-lg bg-accent-strong px-8 py-3 text-sm font-bold text-accent-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}
