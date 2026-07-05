import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Zap, Crown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";

const plans = [
  {
    name: "Free",
    icon: Zap,
    price: 0,
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Access to all active campaigns",
      "Basic analytics dashboard",
      "Standard support",
      "Up to 10 submissions/month",
      "Community chat access",
    ],
    cta: "Get Started Free",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    icon: Crown,
    price: 9,
    period: "month",
    description: "For serious creators",
    features: [
      "Everything in Free",
      "Priority campaign access",
      "Advanced analytics & insights",
      "Priority support (24h response)",
      "Unlimited submissions",
      "Early access to new features",
      "Verified badge",
      "10% bonus on all earnings",
    ],
    cta: "Upgrade to Pro",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Business",
    icon: Rocket,
    price: 29,
    period: "month",
    description: "For teams and agencies",
    features: [
      "Everything in Pro",
      "Team collaboration (up to 5 members)",
      "White-label reports",
      "Dedicated account manager",
      "Custom payout schedules",
      "API access",
      "Priority campaign matching",
      "20% bonus on all earnings",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pricing - Free & Pro Plans for Creators"
        description="Cliperus pricing plans for creators. Start free, upgrade to Pro for unlimited submissions, priority access, and 10% bonus earnings. Simple, transparent pricing."
        keywords="Cliperus pricing, creator plans, Pro subscription, free creator platform"
        canonical="/pricing"
      />
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Choose the plan that fits your goals. Upgrade or downgrade anytime.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={`relative glass-card rounded-2xl p-8 ${
                  plan.popular ? "border-2 border-primary" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 gradient-bg rounded-full text-sm font-semibold text-white">
                    Most Popular
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    plan.popular ? "gradient-bg" : "bg-muted"
                  }`}>
                    <plan.icon className={`w-7 h-7 ${plan.popular ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-2">{plan.name}</h2>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-display font-bold">
                      {plan.price === 0 ? "Free" : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/{plan.period}</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={plan.variant}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <Link to="/auth?mode=signup">{plan.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>

          {/* FAQ Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <p className="text-muted-foreground">
              Have questions?{" "}
              <Link to="/support" className="text-primary hover:underline font-semibold">
                Check our FAQ
              </Link>
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
