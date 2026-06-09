'use client';

import Navigation from '../components/Navigation';
import HeroSection from './sections/HeroSection';
import ValuePropSection from './sections/ValuePropSection';
import CapabilitiesSection from './sections/CapabilitiesSection';
import UseCasesSection from './sections/UseCasesSection';
import WorkflowSection from './sections/WorkflowSection';
import VideoSection from './sections/VideoSection';
import IntegrationSection from './sections/IntegrationSection';
import ResultsSection from './sections/ResultsSection';
import PricingSection from './sections/PricingSection';
import FAQSection from './sections/FAQSection';
import TestimonialsSection from './sections/TestimonialsSection';
import DemoCTASection from './sections/DemoCTASection';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navigation />

      <main>
        <HeroSection />
        <ValuePropSection />
        <CapabilitiesSection />
        <UseCasesSection />
        <WorkflowSection />
        <VideoSection />
        <IntegrationSection />
        <ResultsSection />
        <PricingSection />
        <FAQSection />
        <TestimonialsSection />
        <DemoCTASection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
