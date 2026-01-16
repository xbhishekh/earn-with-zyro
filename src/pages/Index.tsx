import { HeroSection } from "@/components/landing/HeroSection";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
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
        <Features />
        <HowItWorks />
        <Testimonials />
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
        <Features />
        <HowItWorks />
        <Testimonials />
        <Footer />
      </main>
    </div>
  );
};

export default Index;
