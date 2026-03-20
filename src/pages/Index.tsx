import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import BenefitsSection from '@/components/BenefitsSection';
import CotizadorSection from '@/components/CotizadorSection';
import ServiciosSection from '@/components/ServiciosSection';
import ComoFuncionaSection from '@/components/ComoFuncionaSection';
import CoberturaSection from '@/components/CoberturaSection';
import DiferenciadoresSection from '@/components/DiferenciadoresSection';
import TestimoniosSection from '@/components/TestimoniosSection';
import GaleriaSection from '@/components/GaleriaSection';
import FAQSection from '@/components/FAQSection';
import CierreSection from '@/components/CierreSection';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import PixelScript from '@/components/PixelScript';

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <PixelScript />
      <Navbar />
      <HeroSection />
      <BenefitsSection />
      <CotizadorSection />
      <ServiciosSection />
      <ComoFuncionaSection />
      <CoberturaSection />
      <DiferenciadoresSection />
      <TestimoniosSection />
      <GaleriaSection />
      <FAQSection />
      <CierreSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
