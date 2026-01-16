import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FinalCTA = () => {
  return (
    <section className="py-20 md:py-24 relative overflow-hidden bg-muted/30">
      <div className="container mx-auto px-4 relative z-10">
        <div className="relative max-w-4xl mx-auto">
          {/* Gradient Background */}
          <div className="absolute inset-0 gradient-bg rounded-3xl opacity-10 blur-xl" />
          
          <div className="relative bg-card border border-border rounded-3xl p-8 md:p-12 lg:p-16 text-center shadow-xl">
            {/* Icon */}
            <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            {/* Content */}
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Ready to Start <span className="gradient-text">Earning?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of creators already monetizing their content. 
              Sign up free and start earning within minutes.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth?mode=signup">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="lg" asChild>
                <Link to="/campaigns">
                  Explore Campaigns
                </Link>
              </Button>
            </div>

            {/* Trust Badge */}
            <p className="text-sm text-muted-foreground mt-8">
              ✓ Free to join &nbsp; ✓ No hidden fees &nbsp; ✓ Instant withdrawals
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
