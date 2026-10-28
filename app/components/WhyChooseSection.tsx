'use client';
import React, { useEffect, useRef } from 'react';
import AppImage from '@/app/components/ui/AppImage';

const trustBadges = [
{
  icon: 'shield',
  title: 'Licensed & Insured',
  desc: 'Your belongings are protected'
},
{
  icon: 'clock',
  title: 'Same-Day / On-Time Service',
  desc: 'We respect your time'
},
{
  icon: 'users',
  title: 'Professional Team',
  desc: 'Skilled & vetted movers'
},
{
  icon: 'dollar',
  title: 'Transparent Pricing',
  desc: 'No hidden fees'
}];


export default function WhyChooseSection() {
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
      { threshold: 0.1 }
    );
    if (sectionRef?.current) observer?.observe(sectionRef?.current);
    return () => observer?.disconnect();
  }, []);

  return (
    <section id="about" className="relative overflow-hidden" ref={sectionRef}>
      <div className="relative bg-navy min-h-[420px] flex items-center">
        {/* Background photo */}
        <div className="absolute inset-0 z-0">
          <AppImage
            src="https://img.rocket.new/generatedImages/rocket_gen_img_1a2987e0c-1772671737426.png"
            alt="Professional MoveNow mover in dark uniform smiling and carrying boxes, confident and friendly expression"
            fill
            className="object-cover opacity-30"
            sizes="100vw" />
          
          <div className="absolute inset-0 bg-navy/80" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto container-pad py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div className="fade-in-up">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-0.5 bg-primary-public rounded-full" />
                <span className="text-primary-public text-xs font-bold uppercase tracking-wider">Why Choose MoveNow?</span>
              </div>
              <h2 className="text-section-title font-extrabold text-white mb-4 leading-tight">
                More than a move.{' '}
                <span className="text-primary-public">Peace of mind.</span>
              </h2>
              <p className="text-white/70 text-base leading-relaxed max-w-md">
                We go beyond just moving your stuff. We deliver a stress-free experience with professional service, transparent pricing and a team you can trust.
              </p>

              {/* Watermark text */}
              <div className="mt-8 hidden lg:block">
                <p className="text-white/10 font-extrabold text-4xl tracking-wider italic">Your move,</p>
                <p className="text-white/10 font-extrabold text-4xl tracking-wider italic">our priority.</p>
              </div>
            </div>

            {/* Right: badges grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Badge 1: Licensed */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 fade-in-up stagger-1 hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 bg-primary-public/20 rounded-xl flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{trustBadges?.[0]?.title}</h4>
                <p className="text-white/60 text-xs">{trustBadges?.[0]?.desc}</p>
              </div>

              {/* Badge 2: On-Time */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 fade-in-up stagger-2 hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 bg-primary-public/20 rounded-xl flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{trustBadges?.[1]?.title}</h4>
                <p className="text-white/60 text-xs">{trustBadges?.[1]?.desc}</p>
              </div>

              {/* Badge 3: Professional */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 fade-in-up stagger-3 hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 bg-primary-public/20 rounded-xl flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{trustBadges?.[2]?.title}</h4>
                <p className="text-white/60 text-xs">{trustBadges?.[2]?.desc}</p>
              </div>

              {/* Badge 4: Transparent */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 fade-in-up stagger-4 hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 bg-primary-public/20 rounded-xl flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{trustBadges?.[3]?.title}</h4>
                <p className="text-white/60 text-xs">{trustBadges?.[3]?.desc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}