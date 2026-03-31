import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import LeadFormPublic from '@/components/LeadFormPublic';
import BenefitsSection from '@/components/BenefitsSection';
import ServiciosSection from '@/components/ServiciosSection';
import ComoFuncionaSection from '@/components/ComoFuncionaSection';
import CoberturaSection from '@/components/CoberturaSection';
import SeguroSection from '@/components/SeguroSection';
import DiferenciadoresSection from '@/components/DiferenciadoresSection';
import OrganigramaSection from '@/components/OrganigramaSection';
import TestimoniosSection from '@/components/TestimoniosSection';
import GaleriaSection from '@/components/GaleriaSection';
import FAQSection from '@/components/FAQSection';
import CierreSection from '@/components/CierreSection';
import Footer from '@/components/Footer';
import VisitaOcularSection from '@/components/VisitaOcularSection';
import WhatsAppAttention from '@/components/WhatsAppAttention';
import StickyMobileCTA from '@/components/StickyMobileCTA';
import PixelScript from '@/components/PixelScript';

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <PixelScript />
      <Navbar />
      <HeroSection />
      <LeadFormPublic />
      <BenefitsSection />
      <ServiciosSection />
      <ComoFuncionaSection />
      <VisitaOcularSection />
      <CoberturaSection />
      <SeguroSection />
      <DiferenciadoresSection />
      <OrganigramaSection />
      <TestimoniosSection />
      <GaleriaSection />
      <FAQSection />
      <CierreSection />
      <Footer />
      <WhatsAppAttention />
      <StickyMobileCTA />
    </div>
  );
}
