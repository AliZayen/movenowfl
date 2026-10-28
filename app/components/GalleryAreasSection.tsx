'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/app/components/ui/AppImage';

const galleryImages = [
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_105a15805-1783030792272.png",
  alt: 'Movers carefully wrapping white sofa in protective blankets inside a bright Miami apartment'
},
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_1d9cd3c82-1785416216845.png",
  alt: 'MoveNow team loading stacked boxes into a large white moving truck parked on a sunny street'
},
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_1feeceb00-1772172812997.png",
  alt: 'Technician carefully mounting flat screen TV on white wall with cable management in modern home'
},
{
  src: "https://images.unsplash.com/photo-1686100511478-529a0719d460",
  alt: 'Assembled modern sofa in a clean living room with natural light and tropical plants'
}];


const serviceAreas = [
'Miami-Dade', 'Broward', 'Palm Beach', 'Brickell', 'Wynwood',
'Coral Gables', 'Doral', 'Aventura'];


export default function GalleryAreasSection() {
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
    <section className="section-pad bg-white" ref={sectionRef} id="gallery">
      <div className="max-w-7xl mx-auto container-pad">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Gallery */}
          <div>
            <div className="flex items-center justify-between mb-6 fade-in-up">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-0.5 bg-primary-public rounded-full" />
                  <span className="text-primary-public text-xs font-bold uppercase tracking-wider">Our Work</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground-public">Real moves. Real results.</h2>
                <p className="text-muted-foreground text-sm mt-1">Check out some of our latest projects.</p>
              </div>
              <Link href="#gallery" className="text-primary-public text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap">
                View gallery
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* 2x2 image grid */}
            <div className="grid grid-cols-2 gap-3">
              {galleryImages?.map((img, i) =>
              <div
                key={i}
                className={`group relative rounded-xl overflow-hidden fade-in-up ${i === 0 ? 'stagger-1' : i === 1 ? 'stagger-2' : i === 2 ? 'stagger-3' : 'stagger-4'}`}
                style={{ aspectRatio: '4/3' }}>
                
                  <AppImage
                  src={img?.src}
                  alt={img?.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw" />
                
                  <div className="absolute inset-0 bg-foreground-public/0 group-hover:bg-foreground-public/20 transition-colors duration-300" />
                </div>
              )}
            </div>
          </div>

          {/* Right: Service Areas */}
          <div id="service-areas">
            <div className="fade-in-up stagger-2 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-0.5 bg-primary-public rounded-full" />
                <span className="text-primary-public text-xs font-bold uppercase tracking-wider">Service Areas</span>
              </div>
              <h2 className="text-2xl font-extrabold text-foreground-public">Where we show up.</h2>
              <p className="text-muted-foreground text-sm mt-1">Proudly serving Miami and surrounding areas.</p>
            </div>

            {/* Map visual + areas */}
            <div className="relative bg-muted rounded-2xl overflow-hidden border border-border fade-in-up stagger-3" style={{ minHeight: '280px' }}>
              {/* Miami map illustration */}
              <div className="absolute inset-0">
                <AppImage
                  src="https://images.unsplash.com/photo-1726764356034-05c28d9776d5"
                  alt="Aerial view of Miami skyline with Biscayne Bay, clear blue water, and urban grid, bright daylight"
                  fill
                  className="object-cover opacity-30"
                  sizes="(max-width: 1024px) 100vw, 50vw" />
                
                <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-white/40" />
              </div>

              <div className="relative z-10 p-6">
                {/* Miami label */}
                <div className="flex items-center justify-end mb-4">
                  <div className="bg-primary-public text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    MIAMI
                  </div>
                </div>

                {/* Areas grid */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {serviceAreas?.map((area) =>
                  <div key={area} className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
                      <div className="w-2 h-2 bg-primary-public rounded-full shrink-0" />
                      <span className="text-sm font-semibold text-foreground-public">{area}</span>
                    </div>
                  )}
                </div>

                {/* Palm tree watermark */}
                <div className="absolute bottom-4 right-4 text-4xl opacity-20 select-none">🌴</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}