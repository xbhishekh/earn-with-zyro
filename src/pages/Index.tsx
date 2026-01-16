import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Benefits } from "@/components/landing/Benefits";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { MainLayout } from "@/components/layout/MainLayout";

const Index = () => {
  return (
    <MainLayout showHeader={false} showMobileNav={false}>
      <HeroSection />
      <HowItWorks />
      <Benefits />
      <FinalCTA />
      <Footer />
    </MainLayout>
  );
};

export default Index;
