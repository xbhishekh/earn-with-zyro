import { motion } from "framer-motion";
import { 
  Banknote, 
  Shield, 
  Clock, 
  TrendingUp, 
  Users, 
  Gift,
  Zap,
  Globe
} from "lucide-react";

const benefits = [
  {
    icon: Banknote,
    title: "Fair Pay Per View",
    description: "Earn competitive rates for every 1,000 views. No hidden fees.",
  },
  {
    icon: Shield,
    title: "Verified Brands Only",
    description: "Work with trusted brands. Every campaign is vetted.",
  },
  {
    icon: Clock,
    title: "Instant Withdrawals",
    description: "Cash out your earnings anytime. No minimum wait.",
  },
  {
    icon: TrendingUp,
    title: "Growth Analytics",
    description: "Track performance with detailed insights and reports.",
  },
  {
    icon: Users,
    title: "Creator Community",
    description: "Connect with fellow creators, share tips, grow together.",
  },
  {
    icon: Gift,
    title: "Referral Bonuses",
    description: "Earn ₹100 for every creator you refer. Unlimited!",
  },
  {
    icon: Zap,
    title: "Priority Access",
    description: "Top creators get early access to exclusive campaigns.",
  },
  {
    icon: Globe,
    title: "Multi-Platform",
    description: "Instagram, YouTube, TikTok - one account, all platforms.",
  },
];

export const Benefits = () => {
  return (
    <section className="py-20 md:py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Why Creators <span className="gradient-text">Love Us</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need to monetize your creativity
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className="bg-card border border-border rounded-xl p-5 h-full card-hover">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold mb-1.5">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};