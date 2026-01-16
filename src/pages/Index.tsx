import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Benefits } from "@/components/landing/Benefits";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  // Logged in users see the app header, guests see the landing navbar
  if (user) {
    return (
      <MainLayout>
        <HeroSection />
        <HowItWorks />
        <Benefits />
        <FinalCTA />
        <Footer />
      </MainLayout>
    );
  }

  // Guest landing page with Navbar
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 md:pt-20">
        <HeroSection />
        <HowItWorks />
        <Benefits />
        <FinalCTA />
        <Footer />
      </main>
    </div>
  );
};

export default Index;
