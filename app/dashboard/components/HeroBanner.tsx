import React from 'react';
import AppImage from '@/app/components/ui/AppImage';
import Icon from '@/app/components/ui/AppIcon';

interface HeroBannerProps {
  onBook: () => void;
}

export default function HeroBanner({ onBook }: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="absolute inset-y-0 right-0 hidden w-3/5 sm:block">
        <AppImage
          src="https://img.rocket.new/generatedImages/rocket_gen_img_4b0839be6-1792262762332.png"
          alt="MoveNow moving truck with movers loading cardboard boxes beside Miami waterfront towers"
          fill
          priority
          sizes="(max-width: 1280px) 60vw, 720px"
          className="object-cover" />
        
      </div>
      <div className="hero-scrim absolute inset-0 hidden sm:block" />
      <div className="relative z-10 max-w-xl px-6 py-7 sm:px-8 sm:py-9">
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-foreground sm:text-2xl">
          Good morning, John!
          <span aria-hidden="true">👋</span>
        </h1>
        <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
          Need a <span className="text-accent">moving</span> service?
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          Book your next service in just a few clicks.
        </p>
        <button
          type="button"
          onClick={onBook}
          className="mt-6 inline-flex items-center gap-3 rounded-xl bg-accent px-6 py-3.5 text-2xl font-bold text-accent-foreground shadow-soft transition-all duration-150 hover:opacity-90 active:scale-95">
          
          Book a New Service
          <Icon name="ArrowRightIcon" size={18} />
        </button>
      </div>
    </section>);

}