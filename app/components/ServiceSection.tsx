'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/app/components/ui/AppImage';

const services = [
{
  id: 'moving',
  icon: 'truck',
  title: 'Moving',
  description: 'Residential, business and office moves — local and long distance.',
  price: 'From $40',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1384b98d6-1773100531867.png",
  alt: 'Professional movers carrying cardboard boxes in a bright living room with packed furniture'
},
{
  id: 'assembly',
  icon: 'wrench',
  title: 'Furniture Assembly',
  description: 'Beds, desks, tables, cabinets and more. Quick and professional service.',
  price: 'From $40',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d34ff377-1772511949473.png",
  alt: 'Technician assembling wooden furniture with tools on a clean hardwood floor in a modern apartment'
},
{
  id: 'tv-mounting',
  icon: 'monitor',
  title: 'TV Mounting',
  description: 'Secure and clean installation for all TV sizes. Wall mounts and cable management.',
  price: 'From $80',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_112219723-1772182085582.png",
  alt: 'Technician mounting a large flat screen TV on a white wall in a modern living room'
}];


export default function ServicesSection() {
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
    <section id="services" className="section-pad bg-white" ref={sectionRef}>
      <div className="max-w-7xl mx-auto container-pad">
        {/* Header */}
        <div className="mb-10 fade-in-up">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-0.5 bg-primary-public rounded-full" />
            <span className="text-primary-public-strong text-xs font-bold uppercase tracking-wider">Our Services</span>
          </div>
          <h2 className="text-section-title font-extrabold text-foreground-public">
            Three services, one request form.
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Choose what you need and get a fast, hassle-free quote.
          </p>
        </div>

        {/* Service cards grid — 3 equal columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Moving */}
          <div className="group bg-white border border-border rounded-2xl overflow-hidden card-hover fade-in-up stagger-1">
            <div className="relative h-52 overflow-hidden">
              <AppImage
                src={services?.[0]?.image}
                alt={services?.[0]?.alt}
                fill
                className="object-cover service-card-img"
                sizes="(max-width: 768px) 100vw, 33vw" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-foreground-public/40 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <div className="w-10 h-10 bg-primary-public rounded-xl flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect width="20" height="14" x="2" y="7" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-foreground-public mb-1">{services?.[0]?.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{services?.[0]?.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground-public">{services?.[0]?.price}</span>
                <Link href="#quote" className="text-primary-public-strong text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                  Get a quote
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Furniture Assembly */}
          <div className="group bg-white border border-border rounded-2xl overflow-hidden card-hover fade-in-up stagger-2">
            <div className="relative h-52 overflow-hidden">
              <AppImage
                src={services?.[1]?.image}
                alt={services?.[1]?.alt}
                fill
                className="object-cover service-card-img"
                sizes="(max-width: 768px) 100vw, 33vw" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-foreground-public/40 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <div className="w-10 h-10 bg-primary-public rounded-xl flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-foreground-public mb-1">{services?.[1]?.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{services?.[1]?.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground-public">{services?.[1]?.price}</span>
                <Link href="#quote" className="text-primary-public-strong text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                  Get a quote
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: TV Mounting */}
          <div className="group bg-white border border-border rounded-2xl overflow-hidden card-hover fade-in-up stagger-3">
            <div className="relative h-52 overflow-hidden">
              <AppImage
                src={services?.[2]?.image}
                alt={services?.[2]?.alt}
                fill
                className="object-cover service-card-img"
                sizes="(max-width: 768px) 100vw, 33vw" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-foreground-public/40 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <div className="w-10 h-10 bg-primary-public rounded-xl flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect width="20" height="15" x="2" y="3" rx="2" /><polyline points="8 21 12 17 16 21" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-foreground-public mb-1">{services?.[2]?.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{services?.[2]?.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground-public">{services?.[2]?.price}</span>
                <Link href="#quote" className="text-primary-public-strong text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                  Get a quote
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}