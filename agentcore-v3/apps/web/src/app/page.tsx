'use client';

import SmoothScroll from '../components/SmoothScroll';
import ScrollProgress from '../components/ScrollProgress';
import Navigation from '../components/Navigation';
import HeroSection from './sections/HeroSection';
import ValuePropSection from './sections/ValuePropSection';
import CapabilitiesSection from './sections/CapabilitiesSection';
import ArchitectureSection from './sections/ArchitectureSection';
import WorkflowSection from './sections/WorkflowSection';
import PricingSection from './sections/PricingSection';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';

export default function HomePage() {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#F8F9FB] relative">
        <ScrollProgress />
        <Navigation />
        
        <main>
          <HeroSection />
          
          {/* Stats Bar — compact */}
          <section className="py-10 section-padding border-y border-ink-200 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
                {[
                  { value: '9+', label: 'Интеллектуальных моделей' },
                  { value: '2s', label: 'Средний отклик' },
                  { value: '24/7', label: 'Uptime системы' },
                  { value: '100%', label: 'Структурированный поток' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="font-mono-display text-2xl md:text-3xl font-bold text-ink-900 mb-0.5">{stat.value}</div>
                    <div className="caption">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <ValuePropSection />
          <CapabilitiesSection />
          <ArchitectureSection />
          <WorkflowSection />
          <PricingSection />
          <CTASection />
        </main>

        <Footer />
      </div>
    </SmoothScroll>
  );
}
