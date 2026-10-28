'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/app/components/ui/Toast';
import SettingsSidebar from '@/app/profile/components/SettingsSidebar';
import PersonalInfoSection from '@/app/profile/components/PersonalInfoSection';
import AddressesSection from '@/app/profile/components/AddressesSection';
import LanguageSection from '@/app/profile/components/LanguageSection';
import NotificationsSection, { NotificationPrefs } from '@/app/profile/components/NotificationsSection';
import SecuritySection from '@/app/profile/components/SecuritySection';
import PaymentSection from '@/app/profile/components/PaymentSection';
import AppearanceSection from '@/app/profile/components/AppearanceSection';

export default function ProfileClient() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const [active, setActive] = useState('personal');

  const [name, setName] = useState('John Doe');
  const [phone, setPhone] = useState('+1 (305) 555-0123');
  const [address, setAddress] = useState('123 Ocean Dr, Miami, FL, 33139');
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('(GMT-04:00) Eastern Time (US & Canada)');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [prefs, setPrefs] = useState<NotificationPrefs>({ booking: true, messages: true, promos: false, news: false });
  const [theme, setTheme] = useState('light');

  const handleSelect = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setToast('Please fill in all required fields');
      return;
    }
    setToast('Your changes have been saved');
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
          address={address}
          onAddress={setAddress}
          onNotify={setToast}
        />
        <AddressesSection onNotify={setToast} />
        <LanguageSection
          language={language}
          onLanguage={setLanguage}
          timezone={timezone}
          onTimezone={setTimezone}
          dateFormat={dateFormat}
          onDateFormat={setDateFormat}
        />
        <NotificationsSection prefs={prefs} onChange={setPrefs} />
        <SecuritySection onNotify={setToast} />
        <PaymentSection onNotify={setToast} />
        <AppearanceSection theme={theme} onTheme={setTheme} />

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <button
            type="button"
            onClick={() => router?.push('/')}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:border-accent hover:text-accent active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-w-48 rounded-lg bg-accent px-8 py-3 text-sm font-bold text-accent-foreground transition-all hover:opacity-90 active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </div>
      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}
