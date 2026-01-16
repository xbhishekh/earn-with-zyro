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
    description: "Track your performance with real-time insights and metrics.",
  },
  {
    icon: Users,
    title: "Creator Community",
    description: "Connect with fellow creators. Share tips and strategies.",
  },
  {
    icon: Gift,
    title: "Bonus Rewards",
    description: "Earn extra through referrals, milestones, and special events.",
  },
  {
    icon: Zap,
    title: "Quick Approval",
    description: "Get your submissions reviewed within 24-48 hours.",
  },
  {
    icon: Globe,
    title: "Multi-Platform",
    description: "Create for TikTok, Instagram, YouTube, and more.",
  },
];

export const Benefits = () => {
  return (
    <section className="py-20 md:py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Why Creators <span className="gradient-text">Love Us</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need to monetize your creativity
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="group">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
