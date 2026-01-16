import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Benefits } from "@/components/landing/Benefits";
import { AffiliateCTA } from "@/components/landing/AffiliateCTA";
import { AffiliateBanner } from "@/components/landing/AffiliateBanner";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { MainLayout } from "@/components/layout/MainLayout";

const Index = () => {
  return (
    <MainLayout>
      <AffiliateBanner />
      <HeroSection />
      <HowItWorks />
      <Benefits />
      <AffiliateCTA />
      <FinalCTA />
      <Footer />
    </MainLayout>
  );
};

export default Index;
