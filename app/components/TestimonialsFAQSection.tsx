'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppImage from '@/app/components/ui/AppImage';
import { PHONE_PRIMARY } from '@/app/lib/contact';

const testimonials = [
{
  name: 'Jessica M.',
  location: 'Miami, FL',
  date: 'Aug 2025',
  rating: 5,
  text: '"MoveNow made our move so easy. The team was professional, on time and super careful with our furniture. Highly recommend!"',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_103b528db-1763293982935.png",
  avatarAlt: 'Smiling young woman with dark hair, professional headshot on white background'
},
{
  name: 'Daniel R.',
  location: 'Miami, FL',
  date: 'Jul 2025',
  rating: 5,
  text: '"Great service! They assembled our furniture in no time and everything was perfect. Will definitely use them again."',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e678d3dc-1763299155339.png",
  avatarAlt: 'Young man with short hair smiling, casual professional headshot'
},
{
  name: 'Kevin S.',
  location: 'Miami, FL',
  date: 'Jun 2025',
  rating: 5,
  text: '"TV mounting was clean and professional. The technician was friendly and knew exactly what he was doing. Excellent service!"',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10d8f96fa-1772248789704.png",
  avatarAlt: 'Man with beard smiling confidently, casual photo on light background'
}];


const faqs = [
{
  q: 'How much does a move cost in Miami?',
  a: 'Moving costs depend on the size of your home, distance, and additional services. Local moves typically start at $70/hour for a 2-person team. Get a free estimate using our quote form for accurate pricing.'
},
{
  q: 'Do you offer same-day service?',
  a: `Yes! We offer same-day and same-week availability depending on our schedule. Call us at ${PHONE_PRIMARY.display} to check availability.`
},
{
  q: 'Are packing materials included?',
  a: 'Packing materials can be added as an optional service. We bring all necessary supplies including boxes, tape, and protective wrap. This is quoted separately.'
},
{
  q: 'Do you assemble furniture?',
  a: 'Absolutely. Furniture assembly is one of our core services. We assemble beds, desks, tables, cabinets, shelves, and most flat-pack furniture.'
},
{
  q: 'Which areas do you cover?',
  a: 'We serve Miami-Dade, Broward, and Palm Beach counties including Brickell, Wynwood, Coral Gables, Doral, Aventura, and surrounding areas.'
},
{
  q: 'How can I reschedule my booking?',
  a: `You can reschedule by calling us at ${PHONE_PRIMARY.display} or through your account portal. We require at least 24 hours notice for rescheduling.`
}];


export default function TestimonialsFAQSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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

  const prev = () => setActiveIdx((i) => (i - 1 + testimonials?.length) % testimonials?.length);
  const next = () => setActiveIdx((i) => (i + 1) % testimonials?.length);

  return (
    <section className="section-pad bg-muted" ref={sectionRef}>
      <div className="max-w-7xl mx-auto container-pad">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Testimonials */}
          <div>
            <div className="fade-in-up mb-6">
              <h2 className="text-2xl font-extrabold text-foreground-public">What Our Customers Say</h2>
              <p className="text-muted-foreground text-sm mt-1">Real people. Real experiences.</p>

              {/* Google rating */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-sm font-bold text-foreground-public">4.8</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5]?.map((s) =>
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#F97316" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">(1,200+ reviews)</span>
              </div>
            </div>

            {/* Testimonial cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-in-up stagger-2">
              {testimonials?.map((t, i) =>
              <div
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all duration-300 ${
                activeIdx === i ?
                'border-primary-public bg-white shadow-md' :
                'border-border bg-white hover:border-primary-public/50'}`
                }>
                
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5]?.map((s) =>
                  <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#F97316" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                  )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">{t?.text}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <AppImage src={t?.avatar} alt={t?.avatarAlt} width={32} height={32} className="object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground-public">{t?.name}</p>
                      <p className="text-xs text-muted-foreground">{t?.location} · {t?.date}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-5 fade-in-up stagger-3">
              <button onClick={prev} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary-public hover:text-primary-public transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button onClick={next} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary-public hover:text-primary-public transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <span className="text-xs text-muted-foreground">{activeIdx + 1} / {testimonials?.length}</span>
            </div>
          </div>

          {/* Right: FAQ */}
          <div id="faq">
            <div className="fade-in-up stagger-1 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-0.5 bg-primary-public rounded-full" />
                <span className="text-primary-public-strong text-xs font-bold uppercase tracking-wider">Frequently Asked Questions</span>
              </div>
              <h2 className="text-2xl font-extrabold text-foreground-public">Quick answers to your questions.</h2>
            </div>

            <div className="space-y-2 fade-in-up stagger-2">
              {faqs?.map((faq, i) =>
              <div key={i} className="border border-border rounded-xl overflow-hidden bg-white">
                  <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted transition-colors">
                  
                    <span className="text-sm font-semibold text-foreground-public pr-4">{faq?.q}</span>
                    <span className={`text-primary-public shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  {openFaq === i &&
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                      {faq?.a}
                    </div>
                }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>);

}