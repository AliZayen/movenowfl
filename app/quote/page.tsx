'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Address {
  street: string;
  apt: string;
  city: string;
  zip: string;
  floor: string;
  elevator: string;
  parking: string;
  access: string;
  type: 'home' | 'office';
}

interface MoveDetails {
  homeType: string;
  volume: string;
  specialItems: string[];
  notes: string;
}

interface Schedule {
  date: string;
  timeSlot: string;
  flexibility: string;
}

interface FormData {
  from: Address;
  to: Address;
  moveDetails: MoveDetails;
  schedule: Schedule;
  photos: File[];
  extraServices: string[];
}

// ─── Home Type Options ────────────────────────────────────────────────────────
const HOME_TYPES = [
  { id: 'studio', label: 'Studio', sub: '0–500 sqft' },
  { id: '1bed', label: '1 Bedroom', sub: '500–800 sqft' },
  { id: '2bed', label: '2 Bedrooms', sub: '800–1200 sqft' },
  { id: '3bed', label: '3 Bedrooms', sub: '1200–1800 sqft' },
  { id: '4bed', label: '4+ Bedrooms', sub: '1800+ sqft' },
];

const VOLUMES = [
  { id: 'few', label: 'A few items'},
  { id: 'half', label: 'Half a truck'},
  { id: 'full', label: 'Full truck'},
  { id: 'unsure', label: 'Not sure' },
];

const SPECIAL_ITEMS = ['Piano', 'Safe', 'Gym equipment', 'Large appliances', 'Artwork', 'None'];

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', sub: '8am–12pm' },
  { id: 'afternoon', label: 'Afternoon', sub: '12pm–4pm' },
  { id: 'evening', label: 'Evening', sub: '4pm–7pm' },
  { id: 'specific', label: 'Specific time', sub: 'I\'ll specify' },
];

const FLEXIBILITY = [
  { id: 'exact', label: 'Exact date' },
  { id: 'day', label: 'A day before or after' },
  { id: 'week', label: 'Any day this week' },
];

const EXTRA_SERVICES = [
  { id: 'packing', label: 'Packing service', desc: 'We pack everything for you' },
  { id: 'unpacking', label: 'Unpacking service', desc: 'We unpack at your new place' },
  { id: 'assembly', label: 'Furniture assembly', desc: 'Assemble & disassemble furniture' },
  { id: 'tv', label: 'TV mounting', desc: 'Mount your TV on the wall' },
];

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ num, icon, title }: { num: number; icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-full bg-primary-public flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {num}
      </div>
      <div className="text-primary-public">{icon}</div>
      <h3 className="text-lg font-bold text-foreground-public">{title}</h3>
    </div>
  );
}

// ─── Address Form ─────────────────────────────────────────────────────────────
function AddressForm({
  data,
  onChange,
  label,
}: {
  data: Address;
  onChange: (field: keyof Address, value: string) => void;
  label: string;
}) {
  return (
    <div className="space-y-4">
      {/* Home / Office toggle */}
      <div className="flex gap-2 mb-4">
        {(['home', 'office'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange('type', t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all ${
              data.type === t
                ? 'bg-primary-public text-white border-primary-public' :'bg-white text-muted-foreground border-border hover:border-primary-public'
            }`}
          >
            {t === 'home' ? '🏠 Home' : '🏢 Office'}
          </button>
        ))}
      </div>

      {/* Street address */}
      <div>
        <label className="block text-sm font-medium text-foreground-public mb-1">Street address</label>
        <input
          type="text"
          placeholder={`${label} street address`}
          value={data.street}
          onChange={(e) => onChange('street', e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground-public placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public text-sm"
        />
      </div>

      {/* Apt + City */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground-public mb-1">Apt / Suite / Unit</label>
          <input
            type="text"
            placeholder="Optional"
            value={data.apt}
            onChange={(e) => onChange('apt', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground-public placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground-public mb-1">City</label>
          <input
            type="text"
            placeholder="City"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground-public placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public text-sm"
          />
        </div>
      </div>

      {/* ZIP + Floor + Elevator */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground-public mb-1">ZIP code</label>
          <input
            type="text"
            placeholder="33101"
            value={data.zip}
            onChange={(e) => onChange('zip', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground-public placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground-public mb-1">Floor</label>
          <select
            value={data.floor}
            onChange={(e) => onChange('floor', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground-public focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public text-sm"
          >
            <option value="">Select</option>
            {['Ground', '1st', '2nd', '3rd', '4th', '5th', '6th+'].map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground-public mb-1">Elevator</label>
          <select
            value={data.elevator}
            onChange={(e) => onChange('elevator', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground-public focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public text-sm"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="freight">Freight elevator</option>
          </select>
        </div>
      </div>

      {/* Parking */}
      <div>
        <label className="block text-sm font-medium text-foreground-public mb-1">Parking availability</label>
        <select
          value={data.parking}
          onChange={(e) => onChange('parking', e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground-public focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public text-sm"
        >
          <option value="">Select parking type</option>
          <option value="driveway">Driveway</option>
          <option value="street">Street parking</option>
          <option value="loading">Loading dock</option>
          <option value="garage">Parking garage</option>
          <option value="none">No parking nearby</option>
        </select>
      </div>

      {/* Access instructions */}
      <div>
        <label className="block text-sm font-medium text-foreground-public mb-1">Access instructions <span className="text-muted-foreground font-normal">(optional)</span></label>
        <textarea
          rows={2}
          placeholder="Gate code, building entry instructions, etc."
          value={data.access}
          onChange={(e) => onChange('access', e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground-public placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public text-sm resize-none"
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuotePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [signInMode, setSignInMode] = useState<'signin' | 'signup'>('signin');

  const [form, setForm] = useState<FormData>({
    from: { street: '', apt: '', city: 'Miami', zip: '33101', floor: '', elevator: '', parking: '', access: '', type: 'home' },
    to: { street: '', apt: '', city: '', zip: '', floor: '', elevator: '', parking: '', access: '', type: 'home' },
    moveDetails: { homeType: '1bed', volume: 'full', specialItems: ['Safe'], notes: '' },
    schedule: { date: '', timeSlot: 'morning', flexibility: 'exact' },
    photos: [],
    extraServices: [],
  });

  const updateAddress = (side: 'from' | 'to', field: keyof Address, value: string) => {
    setForm((prev) => ({ ...prev, [side]: { ...prev[side], [field]: value } }));
  };

  const toggleSpecialItem = (item: string) => {
    setForm((prev) => {
      const current = prev.moveDetails.specialItems;
      const updated = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
      return { ...prev, moveDetails: { ...prev.moveDetails, specialItems: updated } };
    });
  };

  const toggleExtraService = (id: string) => {
    setForm((prev) => {
      const current = prev.extraServices;
      const updated = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
      return { ...prev, extraServices: updated };
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5);
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ...arr].slice(0, 5) }));
  };

  const removePhoto = (idx: number) => {
    setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }));
  };

  const homeSizeLabel = HOME_TYPES.find((h) => h.id === form.moveDetails.homeType)?.label ?? '—';
  const volumeLabel = VOLUMES.find((v) => v.id === form.moveDetails.volume)?.label ?? '—';

  return (
    <div className="min-h-screen bg-background-public flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto container-pad">
          {/* ── Page Title ────────────────────────────────────────── */}
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-foreground-public">
              Your <span className="text-primary-public">Move Details</span>
            </h1>
          </div>

          {/* Sign In / Sign Up Card */}
          <div className="bg-navy rounded-2xl my-6 p-5 text-white">
            <h3 className="text-sm font-bold mb-1">
              {signInMode === 'signin' ? 'Already have an account?' : 'Create an account'}
            </h3>
            <p className="text-xs text-white/60 mb-4">
              {signInMode === 'signin' ? 'Sign in to save your quote and track your request.' : 'Sign up to save your quote and book faster next time.'}
            </p>

            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-3 py-2.5 rounded-lg bg-navy-light border border-white/10 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-primary-public"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-3 py-2.5 rounded-lg bg-navy-light border border-white/10 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-primary-public"
              />
            </div>

            {signInMode === 'signin' && (
              <div className="flex items-center justify-between mt-3 mb-4">
                <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <button type="button" className="text-xs text-primary-public hover:underline">Forgot password?</button>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <button type="button" className="w-full btn-primary-public py-2.5 rounded-lg text-sm font-bold">
                {signInMode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
              <button
                type="button"
                onClick={() => setSignInMode(signInMode === 'signin' ? 'signup' : 'signin')}
                className="w-full py-2.5 rounded-lg text-sm font-bold border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                {signInMode === 'signin' ? 'Sign up' : 'Sign in instead'}
              </button>
            </div>
          </div>



          {/* ── Two-column layout ─────────────────────────────────── */}
          <div className="flex flex-col xl:flex-row gap-6">

            {/* ── LEFT: Form ────────────────────────────────────────── */}
            <div className="flex-1 space-y-6">

              {/* Section 1: Moving From */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                <SectionHeader
                  num={1}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  }
                  title="Moving from"
                />
                <AddressForm data={form.from} onChange={(f, v) => updateAddress('from', f, v)} label="Origin" />
              </div>

              {/* Section 2: Moving To */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                <SectionHeader
                  num={2}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  }
                  title="Moving to"
                />
                <AddressForm data={form.to} onChange={(f, v) => updateAddress('to', f, v)} label="Destination" />
              </div>

              {/* Section 3: Move Size & Items */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                <SectionHeader
                  num={3}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                  }
                  title="Move size & items"
                />

                {/* Home type selector */}
                <p className="text-sm font-semibold text-foreground-public mb-3">Home type</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
                  {HOME_TYPES.map((ht) => (
                    <button
                      key={ht.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, moveDetails: { ...p.moveDetails, homeType: ht.id } }))}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        form.moveDetails.homeType === ht.id
                          ? 'border-primary-public bg-orange-light text-primary-public' :'border-border bg-white text-foreground-public hover:border-primary-public/50'
                      }`}
                    >
                      <div className="text-sm font-bold">{ht.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{ht.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Volume selector */}
                <p className="text-sm font-semibold text-foreground-public mb-3">Approximate volume</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                  {VOLUMES.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, moveDetails: { ...p.moveDetails, volume: v.id } }))}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        form.moveDetails.volume === v.id
                          ? 'border-primary-public bg-orange-light text-primary-public' :'border-border bg-white text-foreground-public hover:border-primary-public/50'
                      }`}
                    >
                      <div className="text-sm font-bold">{v.label}</div>
                    </button>
                  ))}
                </div>

                {/* Special items */}
                <p className="text-sm font-semibold text-foreground-public mb-3">Special items</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {SPECIAL_ITEMS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleSpecialItem(item)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        form.moveDetails.specialItems.includes(item)
                          ? 'bg-primary-public border-primary-public text-white' :'border-border bg-white text-foreground-public hover:border-primary-public/50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {/* Additional notes */}
                <p className="text-sm font-semibold text-foreground-public mb-2">Additional notes <span className="text-muted-foreground font-normal">(optional)</span></p>
                <textarea
                  rows={3}
                  placeholder="Any special instructions or items we should know about..."
                  value={form.moveDetails.notes}
                  onChange={(e) => setForm((p) => ({ ...p, moveDetails: { ...p.moveDetails, notes: e.target.value } }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground-public placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public text-sm resize-none"
                />
              </div>

              {/* Section 4: Schedule */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                <SectionHeader
                  num={4}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  }
                  title="Schedule"
                />

                {/* Date picker */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-foreground-public mb-1">Preferred move date</label>
                  <input
                    type="date"
                    value={form.schedule.date}
                    onChange={(e) => setForm((p) => ({ ...p, schedule: { ...p.schedule, date: e.target.value } }))}
                    className="w-full sm:w-64 px-4 py-2.5 rounded-lg border border-border bg-white text-foreground-public focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public text-sm"
                  />
                </div>

                {/* Time slots */}
                <p className="text-sm font-semibold text-foreground-public mb-3">Preferred time</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                  {TIME_SLOTS.map((ts) => (
                    <button
                      key={ts.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, schedule: { ...p.schedule, timeSlot: ts.id } }))}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        form.schedule.timeSlot === ts.id
                          ? 'border-primary-public bg-orange-light text-primary-public' :'border-border bg-white text-foreground-public hover:border-primary-public/50'
                      }`}
                    >
                      <div className="text-sm font-bold">{ts.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{ts.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Flexibility */}
                <p className="text-sm font-semibold text-foreground-public mb-3">Date flexibility</p>
                <div className="flex flex-wrap gap-2">
                  {FLEXIBILITY.map((fl) => (
                    <button
                      key={fl.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, schedule: { ...p.schedule, flexibility: fl.id } }))}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        form.schedule.flexibility === fl.id
                          ? 'bg-primary-public border-primary-public text-white' :'border-border bg-white text-foreground-public hover:border-primary-public/50'
                      }`}
                    >
                      {fl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 5: Add Photos */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                <SectionHeader
                  num={5}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  }
                  title="Add photos"
                />

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragOver ? 'border-primary-public bg-orange-light' : 'border-border hover:border-primary-public/50 hover:bg-muted'
                  }`}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-muted-foreground">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p className="text-sm font-semibold text-foreground-public">Drag & drop photos here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse — up to 5 photos</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>

                {/* Photo thumbnails */}
                {form.photos.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {form.photos.map((file, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Uploaded photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 6: Extra Services */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                <SectionHeader
                  num={6}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="16"/>
                      <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                  }
                  title="Extra services"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXTRA_SERVICES.map((svc) => {
                    const checked = form.extraServices.includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => toggleExtraService(svc.id)}
                        className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                          checked ? 'border-primary-public bg-orange-light' : 'border-border bg-white hover:border-primary-public/50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          checked ? 'bg-primary-public border-primary-public' : 'border-border'
                        }`}>
                          {checked && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${checked ? 'text-primary-public' : 'text-foreground-public'}`}>{svc.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{svc.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Bottom Actions ─────────────────────────────────── */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-public">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Your information is secure and encrypted
                </div>
                <div className="flex items-center gap-4">
                  <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground-public transition-colors flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back
                  </Link>
                  <button
                    type="button"
                    className="btn-primary-public px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    Continue to contact details
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>

            </div>

            {/* ── RIGHT: Sidebar ─────────────────────────────────────── */}
            <div className="xl:w-80 space-y-4">

              {/* Move Summary Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-border  top-24">
                <h3 className="text-base font-bold text-foreground-public mb-4 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-public">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  Your Move Summary
                </h3>

                <div className="space-y-3">
                  {[
                    { icon: '🚚', label: 'Service type', value: 'Moving' },
                    { icon: '📅', label: 'Move date', value: form.schedule.date || 'Not selected' },
                    { icon: '📍', label: 'From ZIP', value: form.from.zip || '—' },
                    { icon: '🏁', label: 'To ZIP', value: form.to.zip || '—' },
                    { icon: '🏠', label: 'Home size', value: homeSizeLabel },
                    { icon: '📦', label: 'Move size', value: volumeLabel },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.icon}</span>
                        {item.label}
                      </div>
                      <span className="text-sm font-semibold text-foreground-public">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Need help */}
                <div className="mt-4 p-3 bg-muted rounded-xl">
                  <p className="text-xs font-semibold text-foreground-public mb-1">Need help?</p>
                  <a href="tel:+13055550123" className="flex items-center gap-2 text-sm font-bold text-primary-public hover:underline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    +1 (305) 555-0123
                  </a>
                </div>
              </div>



              {/* Benefits */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Why create an account?</p>
                <div className="space-y-3">
                  {[
                    { icon: '💾', label: 'Save your quote', desc: 'Come back anytime' },
                    { icon: '📡', label: 'Track your request', desc: 'Real-time updates' },
                    { icon: '⚡', label: 'Book faster next time', desc: 'Pre-filled details' },
                  ].map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <span className="text-xl">{b.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-foreground-public">{b.label}</div>
                        <div className="text-xs text-muted-foreground">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
