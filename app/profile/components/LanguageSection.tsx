'use client';

import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import ProfileCard from '@/app/profile/components/ProfileCard';

interface LanguageSectionProps {
  language: string;
  onLanguage: (v: string) => void;
  timezone: string;
  onTimezone: (v: string) => void;
  dateFormat: string;
  onDateFormat: (v: string) => void;
}

interface FieldProps {
  id: string;
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}

function Field({ id, label, icon, value, onChange, options }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-foreground">{label}</label>
      <div className="relative">
        <Icon name={icon} size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-border bg-card pl-10 pr-9 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <Icon name="ChevronDownIcon" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

// Labels shown in the dropdowns ↔ values the API stores.
export const LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'pt', label: 'Português' },
] as const;

export const TIMEZONE_OPTIONS = [
  { id: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { id: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { id: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { id: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
] as const;

export default function LanguageSection(props: LanguageSectionProps) {
  return (
    <ProfileCard
      id="language"
      icon="GlobeAltIcon"
      title="Language & Region"
      subtitle="Choose your preferred language and region settings."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field
          id="language-select"
          label="Language"
          icon="GlobeAltIcon"
          value={props.language}
          onChange={props.onLanguage}
          options={LANGUAGE_OPTIONS.map((o) => o.label)}
        />
        <Field
          id="timezone"
          label="Time Zone"
          icon="ClockIcon"
          value={props.timezone}
          onChange={props.onTimezone}
          options={TIMEZONE_OPTIONS.map((o) => o.label)}
        />
        <Field
          id="date-format"
          label="Date Format"
          icon="CalendarDaysIcon"
          value={props.dateFormat}
          onChange={props.onDateFormat}
          options={['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']}
        />
      </div>
    </ProfileCard>
  );
}
