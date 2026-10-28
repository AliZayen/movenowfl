import React from 'react';
import Link from 'next/link';
import DarkAppLogo from '@/app/components/ui/DarkAppLogo';
import { PHONE_PRIMARY, PHONE_SECONDARY } from '@/app/lib/contact';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto container-pad py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <DarkAppLogo size={36} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xs">
              Miami&apos;s trusted moving company. Fast, reliable, and stress-free moves.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: 'instagram', label: 'Instagram', href: '#' },
                { icon: 'facebook', label: 'Facebook', href: '#' },
                { icon: 'linkedin', label: 'LinkedIn', href: '#' },
                { icon: 'youtube', label: 'YouTube', href: '#' },
              ]?.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary-public transition-colors duration-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {label === 'Instagram' && <><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37m1.5-4.87h.01"/></>}
                    {label === 'Facebook' && <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>}
                    {label === 'LinkedIn' && <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></>}
                    {label === 'YouTube' && <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></>}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Navigation</h4>
            <ul className="space-y-2">
              {['Home', 'About', 'Services', 'Gallery', 'Service Areas', 'FAQ', 'Contact']?.map((item) => (
                <li key={item}>
                  <Link href={item === 'Home' ? '/' : `#${item?.toLowerCase()?.replace(' ', '-')}`} className="text-sm text-muted-foreground hover:text-primary-public transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Services</h4>
            <ul className="space-y-2">
              {['Moving Services', 'Furniture Assembly', 'TV Mounting', 'Packing Services', 'Storage Solutions', 'Long Distance']?.map((item) => (
                <li key={item}>
                  <Link href="#services" className="text-sm text-muted-foreground hover:text-primary-public transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-public mt-0.5 shrink-0">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="text-sm text-muted-foreground">16970 NW 4th Ave, Miami, FL 33169</span>
              </li>
              <li className="flex items-top gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-public shrink-0">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <div className='flex flex-col'>
                  <a href={PHONE_PRIMARY.href} className="text-sm text-muted-foreground hover:text-primary-public transition-colors">{PHONE_PRIMARY.display}</a>
                  <a href={PHONE_SECONDARY.href} className="text-sm text-muted-foreground hover:text-primary-public transition-colors">{PHONE_SECONDARY.display}</a>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-public shrink-0">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-sm text-muted-foreground">7 days a week : 8AM – 8PM</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto container-pad py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DarkAppLogo size={24} />
            <span className="text-xs text-muted-foreground">© 2025 MoveNow. All rights reserved.</span>
          </div>
          <nav className="flex items-center gap-6">
            {['Home', 'About', 'Services', 'Gallery', 'Service Areas', 'FAQ', 'Contact']?.map((item) => (
              <Link key={item} href={item === 'Home' ? '/' : `#${item?.toLowerCase()?.replace(' ', '-')}`} className="text-xs text-muted-foreground hover:text-primary-public transition-colors">
                {item}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary-public transition-colors">Privacy</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary-public transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}