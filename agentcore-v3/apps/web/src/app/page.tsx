'use client';

import dynamic from 'next/dynamic';
import Navigation from '../components/Navigation';
import HeroSection from './sections/HeroSection';
import ValuePropSection from './sections/ValuePropSection';
import CapabilitiesSection from './sections/CapabilitiesSection';
import UseCasesSection from './sections/UseCasesSection';
import WorkflowSection from './sections/WorkflowSection';
import VideoSection from './sections/VideoSection';
import IntegrationSection from './sections/IntegrationSection';
import ResultsSection from './sections/ResultsSection';
import AboutTeamSection from './sections/AboutTeamSection';

const PricingSection = dynamic(() => import('./sections/PricingSection'), { ssr: false });
const FAQSection = dynamic(() => import('./sections/FAQSection'), { ssr: false });
const TestimonialsSection = dynamic(() => import('./sections/TestimonialsSection'), { ssr: false });
const DemoCTASection = dynamic(() => import('./sections/DemoCTASection'), { ssr: false });
const CTASection = dynamic(() => import('./sections/CTASection'), { ssr: false });
const Footer = dynamic(() => import('./sections/Footer'), { ssr: false });

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
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
        <AboutTeamSection />
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
