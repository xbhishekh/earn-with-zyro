import { 
  Download, 
  Shield, 
  Zap, 
  CreditCard,
  Globe
} from "lucide-react";

const features = [
  {
    icon: Download,
    title: "Instant Downloads",
    description: "Access your purchases immediately. No waiting, no delays—just instant delivery to your inbox.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Bank-grade encryption protects every transaction. Your payment info stays safe with us.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Browse thousands of products with blazing speed. Our platform is optimized for performance.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: CreditCard,
    title: "Easy Payouts",
    description: "Sellers get paid instantly. Withdraw your earnings anytime with zero minimum thresholds.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Sell to customers worldwide. Accept payments from 100+ countries effortlessly.",
    color: "from-indigo-500 to-violet-500",
  },
];

export const Benefits = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Why Zyrozo?</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Built for <span className="gradient-text">Creators & Buyers</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to buy, sell, and grow in the creator economy—all in one powerful platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className={`group relative ${index === 4 ? 'lg:col-start-2' : ''}`}
            >
              <div className="relative bg-card border border-border rounded-2xl p-8 h-full hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                {/* Gradient Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
