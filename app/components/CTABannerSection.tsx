'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/app/components/ui/AppImage';
import { PHONE_PRIMARY } from '@/app/lib/contact';

export default function CTABannerSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.fade-in-up').forEach((el) => {
              el.classList.add('visible');
            });
          }
        });
      },
      { threshold: 0.2 }
    );
    if (sectionRef?.current) observer?.observe(sectionRef?.current);
    return () => observer?.disconnect();
  }, []);

  return (
    <section id="contact" className="relative overflow-hidden" ref={sectionRef}>
      <div className="relative bg-navy py-16 md:py-20">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <AppImage
            src="https://images.unsplash.com/photo-1726495987564-f54558b1b7e5"
            alt="Miami city skyline at dusk with glowing orange sky, palm tree silhouettes in the foreground"
            fill
            className="object-cover opacity-20"
            sizes="100vw" />
          
          <div className="absolute inset-0 bg-navy/85" />
        </div>

        {/* Orange blob */}
        <div className="absolute right-0 top-0 w-96 h-96 blob-orange opacity-30 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto container-pad">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="fade-in-up text-center md:text-left">
              <h2 className="text-section-title font-extrabold text-white mb-2">
                Ready to get moving?
              </h2>
              <p className="text-white/70 text-base">
                Contact us today for a free quote and let&apos;s make it happen!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 fade-in-up stagger-2">
              <Link
                href="#quote"
                className="btn-primary-public px-8 py-3.5 text-base font-bold rounded-lg flex items-center gap-2 whitespace-nowrap">
                
                Get a Quote
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href={PHONE_PRIMARY.href}
                className="flex items-center gap-2 px-8 py-3.5 text-base font-bold text-white border-2 border-white/30 rounded-lg hover:border-white/60 hover:bg-white/10 transition-all whitespace-nowrap">
                
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Call {PHONE_PRIMARY.display}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>);

}