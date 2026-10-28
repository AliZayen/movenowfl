'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppImage from '@/app/components/ui/AppImage';

const serviceRoutes: Record<string, string> = {
  'Moving': '/book-service/moving',
  'Furniture Assembly': '/book-service/furniture-assembly',
  'TV Mounting': '/book-service/tv-mounting',
};

const trustBadges = [
{ icon: 'shield', label: 'Licensed & Insured' },
{ icon: 'clock', label: 'Same-week Availability' },
{ icon: 'star', label: '4.8 Average Rating' }];


export default function HeroSection() {
  const [serviceType, setServiceType] = useState('Moving');
  const [fromZip, setFromZip] = useState('');
  const [toZip, setToZip] = useState('');
  const [moveDate, setMoveDate] = useState('');
  const router = useRouter();
  const isMoving = serviceType === 'Moving';

  // Block past dates. Set on focus so the date is read in the browser, not at prerender.
  const setMinToToday = (e: React.FocusEvent<HTMLInputElement>) => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    e.currentTarget.min = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (fromZip) params.set('fromZip', fromZip);
    if (isMoving && toZip) params.set('toZip', toZip);
    if (moveDate) params.set('date', moveDate);
    const qs = params.toString();
    router.push(`${serviceRoutes[serviceType]}${qs ? `?${qs}` : ''}`);
  };

  return (
    <section id="hero" className="relative min-h-[calc(100vh-112px)] flex items-center overflow-hidden noise-overlay">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <AppImage
          src="/assets/images/truck.png"
          alt="MoveNow truck with movers carrying boxes in front of Miami skyline with palm trees, bright sunny day"
          fill
          priority
          className="object-cover"
          sizes="100vw" />
        
        {/* Gradient overlay — left to right for white text */}
        <div className="absolute inset-0 bg-gradient-to-l from-navy/90 via-navy/80 to-navy/70" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-navy/40 to-transparent" />
      </div>

      {/* Eyebrow label */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto container-pad pt-8">
          <div className="flex items-center gap-2">
            <span className="text-primary-public font-bold text-xs tracking-widest uppercase">Moving • Assembly • TV Mounting</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto container-pad py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Quick estimate form  */}
          <div className="lg:col-span-5" id="quote">
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-border">
              {/* Form header */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-primary-public-strong text-xs font-bold uppercase tracking-wider">— Get Your Free Quote</span>
                </div>
                <h2 className="text-xl font-extrabold text-foreground-public tracking-tight">Quick & Easy Estimate</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill out the form below and get a personalized quote in less than 2 minutes.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Service type */}
                <div>
                  <label htmlFor="hero-service" className="block text-xs font-semibold text-foreground-public mb-1.5 uppercase tracking-wide">Service type</label>
                  <div className="relative">
                    <select
                      id="hero-service"
                      value={serviceType}
                      onChange={(e) => setServiceType(e?.target?.value)}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground-public appearance-none focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public transition-colors">
                      
                      <option>Moving</option>
                      <option>Furniture Assembly</option>
                      <option>TV Mounting</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {/* ZIP codes */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="hero-from-zip" className="block text-xs font-semibold text-foreground-public mb-1.5 uppercase tracking-wide">
                      {isMoving ? 'From (ZIP code)' : 'ZIP code'}
                    </label>
                    <input
                      id="hero-from-zip"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      required
                      pattern="\d{5}"
                      maxLength={5}
                      title="Enter a 5-digit ZIP code"
                      placeholder="e.g. 33101"
                      value={fromZip}
                      onChange={(e) => setFromZip(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground-public placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public transition-colors" />

                  </div>
                  {isMoving &&
                  <div>
                    <label htmlFor="hero-to-zip" className="block text-xs font-semibold text-foreground-public mb-1.5 uppercase tracking-wide">To (ZIP code)</label>
                    <input
                      id="hero-to-zip"
                      type="text"
                      inputMode="numeric"
                      required
                      pattern="\d{5}"
                      maxLength={5}
                      title="Enter a 5-digit ZIP code"
                      placeholder="e.g. 33101"
                      value={toZip}
                      onChange={(e) => setToZip(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground-public placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public transition-colors" />

                  </div>
                  }
                </div>

                {/* Service date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="hero-date" className="block text-xs font-semibold text-foreground-public mb-1.5 uppercase tracking-wide">
                      {isMoving ? 'Move date' : 'Service date'}
                    </label>
                    <div className="relative">
                      <input
                        id="hero-date"
                        type="date"
                        onFocus={setMinToToday}
                        value={moveDate}
                        onChange={(e) => setMoveDate(e?.target?.value)}
                        className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground-public focus:outline-none focus:ring-2 focus:ring-primary-public/30 focus:border-primary-public transition-colors" />
                      
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" className="btn-primary-public w-full py-3.5 text-base font-bold rounded-lg flex items-center justify-center gap-2 mt-1">
                  Get My Free Estimate
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>

                <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Your information is safe and secure. No obligation.
                </p>
              </form>
            </div>
          </div>
 

          {/* Right: Headline */}
          <div className="lg:col-span-7">
            <h1 className="text-hero-xl font-extrabold text-white mb-6 leading-[1.05]">
              Miami moves fast.{' '}
              <span className="text-primary-public">So does MoveNow.</span>
            </h1>
            <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-lg">
              Tell us what you need. Moving, furniture assembly, or TV mounting — we make it simple, secure, and stress-free. From packing to setup, we&apos;ve got you covered in Miami and beyond.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4">
              {trustBadges?.map(({ icon, label }) =>
              <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                  <span className="text-primary-public">
                    {icon === 'shield' &&
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                  }
                    {icon === 'clock' &&
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                  }
                    {icon === 'star' &&
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                  }
                  </span>
                  <span className="text-white text-xs font-semibold">{label}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>);

}