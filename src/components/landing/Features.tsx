import { Download, Store, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Download,
    title: "Fast Downloads",
    description: "Get instant access to your purchased clips with lightning-fast download speeds.",
  },
  {
    icon: Store,
    title: "Easy Selling",
    description: "List your content in minutes. Set your price, upload, and start earning.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    description: "Every transaction is protected with industry-standard encryption and fraud prevention.",
  },
];

export const Features = () => {
  return (
    <section className="py-20 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Why Choose <span className="gradient-text">Zyrozo</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Built for creators, designed for success
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
          {features.map((feature) => (
            <div key={feature.title} className="group text-center">
              <div className="bg-card border border-border rounded-2xl p-8 h-full card-hover">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto gradient-bg rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
