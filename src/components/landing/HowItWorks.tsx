import { motion } from "framer-motion";
import { UserPlus, Video, Eye, Wallet } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up Free",
    description: "Create your account in under 60 seconds. No fees, no commitments.",
  },
  {
    icon: Video,
    title: "Join Campaigns",
    description: "Browse active campaigns from top brands and join the ones you love.",
  },
  {
    icon: Eye,
    title: "Create & Submit",
    description: "Create engaging content, post on your socials, and submit for review.",
  },
  {
    icon: Wallet,
    title: "Get Paid",
    description: "Earn money for every 1,000 views. Withdraw anytime to your account.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 md:py-24 relative bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            How <span className="gradient-text">Zyrozo</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start earning in 4 simple steps. No experience required.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/30 to-secondary/30" />
              )}

              <div className="relative bg-card border border-border rounded-2xl p-6 md:p-8 h-full card-hover">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 gradient-bg rounded-full flex items-center justify-center font-display font-bold text-sm text-white shadow-lg">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 gradient-bg rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <step.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="font-display text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};