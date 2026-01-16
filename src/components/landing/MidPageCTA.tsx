import { Link } from "react-router-dom";
import { ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MidPageCTA = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative max-w-5xl mx-auto">
          {/* Gradient Background */}
          <div className="absolute inset-0 gradient-bg rounded-3xl" />
          
          {/* Content */}
          <div className="relative px-8 py-12 md:px-16 md:py-16 text-center text-white">
            <Rocket className="w-12 h-12 mx-auto mb-6 opacity-90" />
            
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Ready to Start Selling?
            </h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
              List your first product in under 5 minutes. No upfront costs, 
              no hidden fees—just pure creator income.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="xl" 
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90 font-semibold"
                asChild
              >
                <Link to="/auth?mode=signup">
                  Start Selling Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button 
                size="xl" 
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link to="/marketplace">
                  Browse Marketplace
                </Link>
              </Button>
            </div>
            
            {/* Trust Points */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-white/70">
              <span>✓ No listing fees</span>
              <span>✓ 90% revenue share</span>
              <span>✓ Instant payouts</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
