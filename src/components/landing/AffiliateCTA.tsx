import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Share2, DollarSign, Users, Gift, Zap, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Share2,
    title: "Share Your Link",
    description: "Get a unique referral link: zyrozo.com/?ref=yourname",
  },
  {
    icon: Users,
    title: "Friends Sign Up",
    description: "When they join using your link, you get tracked automatically",
  },
  {
    icon: DollarSign,
    title: "Earn ₹100 + Commission",
    description: "Get ₹100 per signup + 10% of their earnings forever!",
  },
];

const benefits = [
  "No limit on referrals - invite as many as you want",
  "Lifetime commission on all referred users",
  "Real-time tracking dashboard",
  "Instant payouts to your wallet",
];

export const AffiliateCTA = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Gift className="w-4 h-4" />
              Affiliate Program
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Earn While You <span className="gradient-text">Share</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Invite creators to Zyrozo and earn passive income from their success. 
              Join thousands of affiliates earning every month!
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center mb-12">
            {/* Left: How It Works */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="font-display text-2xl font-bold mb-6">
                How It Works
              </h3>
              
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 p-4 rounded-xl bg-card border border-border card-hover"
                >
                  <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold mb-1">
                      Step {index + 1}: {feature.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Right: Benefits Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl border border-border p-6 md:p-8 card-hover"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">Why Join?</h3>
                  <p className="text-sm text-muted-foreground">Exclusive benefits for affiliates</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* Earning Example */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Example Earnings</span>
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="font-display text-2xl font-bold gradient-text">₹10,000+</div>
                    <div className="text-xs text-muted-foreground">Per 100 referrals</div>
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold gradient-text">10%</div>
                    <div className="text-xs text-muted-foreground">Lifetime commission</div>
                  </div>
                </div>
              </div>

              <Button variant="hero" size="lg" className="w-full" asChild>
                <Link to="/affiliate">
                  Become an Affiliate
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Bottom CTA for mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:hidden text-center"
          >
            <Button variant="hero" size="xl" asChild>
              <Link to="/affiliate">
                Start Earning Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};