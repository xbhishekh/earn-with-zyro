import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FinalCTA = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="relative max-w-4xl mx-auto">
          {/* Gradient Glow */}
          <div className="absolute inset-0 gradient-bg rounded-3xl opacity-10 blur-2xl scale-110" />
          
          <div className="relative bg-card border border-border rounded-3xl p-8 md:p-12 lg:p-16 text-center shadow-2xl">
            {/* Icon */}
            <div className="w-20 h-20 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            {/* Content */}
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Join the Creator <span className="gradient-text">Revolution</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Whether you're buying premium digital assets or selling your creations, 
              Zyrozo is your home. Start your journey today.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth?mode=signup">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <Link to="/marketplace">
                  Explore Products
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full" />
                Free to join
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full" />
                Secure checkout
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full" />
                Instant access
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
