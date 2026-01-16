import { Search, Heart, ShoppingBag } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "Step 1",
    title: "Explore Clips",
    description: "Browse our vast collection of high-quality digital clips from talented creators.",
  },
  {
    icon: Heart,
    step: "Step 2",
    title: "Choose What You Like",
    description: "Find the perfect content that matches your needs with our smart filters.",
  },
  {
    icon: ShoppingBag,
    step: "Step 3",
    title: "Buy or Sell Instantly",
    description: "Complete your purchase in seconds or list your own content to start earning.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 md:py-24 relative bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Get started in three simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((item, index) => (
            <div key={item.title} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/30 to-secondary/30" />
              )}

              <div className="relative text-center">
                {/* Step Badge */}
                <div className="inline-flex items-center justify-center px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">
                  {item.step}
                </div>

                {/* Icon */}
                <div className="w-20 h-20 mx-auto gradient-bg rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <item.icon className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
