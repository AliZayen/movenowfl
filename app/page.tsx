import React from 'react';
import Header from '@/app/components/Header';
import Footer from './components/Footer';
import HeroSection from '@/app/components/HeroSection';
import ServicesSection from './components/ServiceSection';
import WhyChooseSection from './components/WhyChooseSection';
import HowItWorksSection from './components/HowItWorksSection';
import GalleryAreasSection from './components/GalleryAreasSection';
import TestimonialsFAQSection from './components/TestimonialsFAQSection';
import CTABannerSection from './components/CTABannerSection';


export default function HomePage() {
  return (
    <main className="min-h-screen bg-background-public overflow-x-hidden">
      <Header />
      <HeroSection />
      <ServicesSection/>
      <WhyChooseSection />
      <HowItWorksSection />
      <GalleryAreasSection />
      <TestimonialsFAQSection />
      <CTABannerSection />
      <Footer />
    </main>
  );
}