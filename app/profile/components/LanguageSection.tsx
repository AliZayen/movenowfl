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
          id="language"
          label="Language"
          icon="GlobeAltIcon"
          value={props.language}
          onChange={props.onLanguage}
          options={['English', 'Español', 'Português']}
        />
        <Field
          id="timezone"
          label="Time Zone"
          icon="ClockIcon"
          value={props.timezone}
          onChange={props.onTimezone}
          options={[
            '(GMT-04:00) Eastern Time (US & Canada)',
            '(GMT-05:00) Central Time (US & Canada)',
            '(GMT-07:00) Mountain Time (US & Canada)',
            '(GMT-08:00) Pacific Time (US & Canada)',
          ]}
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
