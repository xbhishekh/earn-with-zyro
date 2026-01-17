import { HeroSection } from "@/components/landing/HeroSection";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { SEO, organizationSchema, websiteSchema, createFAQSchema } from "@/components/SEO";

// Homepage FAQ for structured data
const homeFAQs = [
  {
    question: "What is Zyrozo?",
    answer: "Zyrozo is the #1 creator rewards platform where content creators earn real money for their videos. Join campaigns, post clips on TikTok, YouTube, or Instagram, and get paid for every 1,000 views."
  },
  {
    question: "How do creators earn money on Zyrozo?",
    answer: "Creators earn by joining campaigns, creating content, and posting it on social media. You get paid based on the views your content receives - typically $1-5 per 1,000 views depending on the campaign."
  },
  {
    question: "Is Zyrozo free to join?",
    answer: "Yes! Zyrozo is completely free to join. There are no upfront costs or hidden fees. You keep what you earn minus a small platform fee."
  },
  {
    question: "How much can I earn on Zyrozo?",
    answer: "Earnings vary based on your content's performance. Top creators earn $1,000+ monthly. We've paid out over $50,000 to our creator community."
  }
];

const Index = () => {
  const { user } = useAuth();

  const seoContent = (
    <SEO
      title="Zyrozo - #1 Creator Rewards Platform"
      description="Join 5,000+ creators earning real money on Zyrozo. Get paid for every view on TikTok, YouTube & Instagram. $50K+ already paid out. Start earning today!"
      keywords="creator rewards platform, earn money creating content, UGC platform, clipping campaigns, affiliate earnings, creator marketplace, TikTok earnings, YouTube monetization"
      canonical="/"
      structuredData={[organizationSchema, websiteSchema, createFAQSchema(homeFAQs)]}
    />
  );

  // Logged in users see the app header, guests see the landing navbar
  if (user) {
    return (
      <MainLayout>
        {seoContent}
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
      {seoContent}
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
