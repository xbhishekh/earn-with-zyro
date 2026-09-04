import { HeroSection } from "@/components/landing/HeroSection";
import { Marquee } from "@/components/landing/Marquee";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { SEO, organizationSchema, websiteSchema, createFAQSchema } from "@/components/SEO";

// Homepage FAQ for structured data
const homeFAQs = [
  {
    question: "What is Cliperus?",
    answer: "Cliperus is the #1 creator rewards platform where content creators earn real money for their videos. Join campaigns, post clips on TikTok, YouTube, or Instagram, and get paid for every 1,000 views."
  },
  {
    question: "How do creators earn money on Cliperus?",
    answer: "Creators earn by joining campaigns, creating content, and posting it on social media. You get paid based on the views your content receives - typically $1-5 per 1,000 views depending on the campaign."
  },
  {
    question: "Is Cliperus free to join?",
    answer: "Yes! Cliperus is completely free to join. There are no upfront costs or hidden fees. You keep what you earn minus a small platform fee."
  },
  {
    question: "How much can I earn on Cliperus?",
    answer: "Earnings vary based on your content's performance. Top creators earn $1,000+ monthly. We've paid out over $50,000 to our creator community."
  }
];

const Index = () => {
  const { user } = useAuth();

  const seoContent = (
    <SEO
      title="Cliperus - #1 Creator Rewards Platform"
      description="Join 5,000+ creators earning real money on Cliperus. Get paid for every view on TikTok, YouTube & Instagram. $50K+ already paid out. Start earning today!"
      keywords="creator rewards platform, earn money creating content, UGC platform, clipping campaigns, affiliate earnings, creator marketplace, TikTok earnings, YouTube monetization"
      canonical="/"
      structuredData={[organizationSchema, websiteSchema, createFAQSchema(homeFAQs)]}
    />
  );

  // Logged in users go straight to the campaigns dashboard
  if (user) {
    return <Navigate to="/campaigns" replace />;
  }


  // Guest landing page with Navbar
  return (
    <div className="min-h-screen bg-background">
      {seoContent}
      <Navbar />
      <main className="pt-16 md:pt-20">
        <HeroSection />
        <Marquee />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTASection />
        <Footer />
      </main>
    </div>
  );
};

export default Index;
