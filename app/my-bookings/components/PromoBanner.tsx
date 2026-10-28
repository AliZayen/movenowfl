import React from 'react';
import AppImage from '@/app/components/ui/AppImage';
import Icon from '@/app/components/ui/AppIcon';

interface PromoBannerProps {
  onBook: () => void;
}

export default function PromoBanner({ onBook }: PromoBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-foreground shadow-soft">
      <AppImage
        src="https://images.unsplash.com/photo-1695893575649-443eb38b5e3e"
        alt="MoveNow moving truck parked beside Miami skyline with palm trees"
        fill
        sizes="(max-width: 1280px) 100vw, 420px"
        className="object-cover opacity-70" />
      
      <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/80 to-transparent" />
      <div className="relative z-10 max-w-[75%] p-5">
        <h2 className="text-lg font-extrabold leading-tight text-background">Need a moving service?</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-background/80">
          Book your next moving, assembly or TV mounting service in just a few clicks.
        </p>
        <button
          type="button"
          onClick={onBook}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-accent-foreground transition-all duration-150 hover:opacity-90 active:scale-95">
          
          Book a New Service <Icon name="ArrowRightIcon" size={14} />
        </button>
      </div>
    </section>);

}