'use client';

import dynamic from 'next/dynamic';
import Navigation from '../components/Navigation';
import HeroSection from './sections/HeroSection';
import ValuePropSection from './sections/ValuePropSection';
import CapabilitiesSection from './sections/CapabilitiesSection';
import UseCasesSection from './sections/UseCasesSection';
import WorkflowSection from './sections/WorkflowSection';
import PricingSection from './sections/PricingSection';
import FAQSection from './sections/FAQSection';
import TestimonialsSection from './sections/TestimonialsSection';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';
import SmoothScroll from '../components/SmoothScroll';
import ScrollProgress from '../components/ScrollProgress';
import { motion } from 'framer-motion';
import { LANDING_STATS } from '../data/landingContent';

const AnimatedCounter = dynamic(() => import('../components/AnimatedCounter'), { ssr: false });

function SectionDivider() {
  return (
    <div className="relative h-6 -mt-px overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-white" />
      <svg
        className="absolute bottom-0 w-full h-6 text-[#F8F9FB] fill-current"
        viewBox="0 0 1440 24"
        preserveAspectRatio="none"
      >
        <path d="M0,24 C240,0 480,24 720,12 C960,0 1200,24 1440,12 L1440,24 L0,24 Z" />
      </svg>
    </div>
  );
}

function SectionDividerInvert() {
  return (
    <div className="relative h-6 -mt-px overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#F8F9FB]" />
      <svg
        className="absolute bottom-0 w-full h-6 text-white fill-current"
        viewBox="0 0 1440 24"
        preserveAspectRatio="none"
      >
        <path d="M0,24 C240,0 480,24 720,12 C960,0 1200,24 1440,12 L1440,24 L0,24 Z" />
      </svg>
    </div>
  );
}

export default function HomePage() {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#F8F9FB] relative">
        <ScrollProgress />
        <Navigation />

        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-gradient-to-bl from-mauve-200/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-[30%] left-[5%] w-[400px] h-[400px] bg-gradient-to-tr from-mauve-100/15 to-transparent rounded-full blur-3xl" />
        </div>

        <main>
          <HeroSection />

          <SectionDivider />

          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="py-12 section-padding bg-white relative"
          >
            <div className="absolute inset-0 dot-pattern opacity-[0.04] pointer-events-none" />
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {LANDING_STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center"
                  >
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      className="font-mono-display text-3xl md:text-4xl font-bold text-ink-900 mb-1"
                    />
                    <div className="caption text-sm">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <SectionDividerInvert />

          <ValuePropSection />
          <CapabilitiesSection />
          <UseCasesSection />
          <WorkflowSection />
          <PricingSection />
          <FAQSection />
          <TestimonialsSection />
          <CTASection />
        </main>

        <Footer />
      </div>
    </SmoothScroll>
  );
}
