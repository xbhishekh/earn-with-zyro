import { Search, MousePointer, Download, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Browse",
    description: "Explore thousands of digital products, clips, courses, and tools from top creators.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: MousePointer,
    number: "02",
    title: "Select",
    description: "Find exactly what you need with powerful filters and curated collections.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Download,
    number: "03",
    title: "Download",
    description: "Complete your purchase securely and get instant access to your digital assets.",
    color: "from-orange-500 to-amber-500",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 md:py-28 relative bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Getting started is simple. Browse, buy, and download in seconds.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
            {/* Connector Lines */}
            <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30" />

            {steps.map((step, index) => (
              <div key={step.title} className="relative group">
                <div className="text-center">
                  {/* Step Number */}
                  <div className="inline-flex items-center justify-center mb-6">
                    <div className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} p-[2px] group-hover:scale-105 transition-transform duration-300`}>
                      <div className="w-full h-full rounded-3xl bg-background flex items-center justify-center">
                        <step.icon className="w-10 h-10 text-foreground" />
                      </div>
                      {/* Number Badge */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">{step.description}</p>
                </div>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center my-6">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
