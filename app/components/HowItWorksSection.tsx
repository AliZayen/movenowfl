'use client';
import React, { useEffect, useRef } from 'react';

const steps = [
  {
    num: '1',
    icon: 'message',
    title: 'Request',
    desc: 'Tell us what you need via our form or call.',
  },
  {
    num: '2',
    icon: 'chat',
    title: 'Details',
    desc: 'We confirm details, answer your questions.',
  },
  {
    num: '3',
    icon: 'calendar',
    title: 'Schedule',
    desc: 'We set the best date and time.',
  },
  {
    num: '4',
    icon: 'check',
    title: 'Confirmation',
    desc: 'You get a final summary and confirmation.',
  },
  {
    num: '5',
    icon: 'truck',
    title: 'Moving day',
    desc: 'Our team arrives and gets it done.',
  },
];

export default function HowItWorksSection() {
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
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const getIcon = (icon: string) => {
    const props = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'white', strokeWidth: 2 as number };
    switch (icon) {
      case 'message': return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
      case 'chat': return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/></svg>;
      case 'calendar': return <svg {...props}><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
      case 'check': return <svg {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
      case 'truck': return <svg {...props}><rect width="16" height="13" x="1" y="3" rx="2"/><polygon points="17 3 21 7 21 13 17 13 17 3"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
      default: return null;
    }
  };

  return (
    <section className="section-pad bg-muted" ref={sectionRef}>
      <div className="max-w-7xl mx-auto container-pad">
        {/* Header */}
        <div className="mb-12 fade-in-up">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-0.5 bg-primary-public rounded-full" />
            <span className="text-primary-public-strong text-xs font-bold uppercase tracking-wider">How It Works</span>
          </div>
          <h2 className="text-section-title font-extrabold text-foreground-public">
            From request to move-in day.
          </h2>
          <p className="text-muted-foreground mt-2 text-base">It&apos;s simple. Just 5 steps.</p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary-public via-orange-mid to-primary-public/30 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 md:gap-4 relative z-10">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`fade-in-up flex flex-col items-center text-center`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Circle */}
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-primary-public rounded-full flex items-center justify-center shadow-lg orange-glow">
                    {getIcon(step.icon)}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-navy rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{step.num}</span>
                  </div>
                </div>
                <h4 className="font-bold text-foreground-public text-base mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}