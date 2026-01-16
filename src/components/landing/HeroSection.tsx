import { Link } from "react-router-dom";
import { ArrowRight, Play, Star, Shield, Zap, Users, ShoppingBag, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const trustBadges = [
  "10,000+ Digital Products",
  "Trusted by Creators",
  "Instant Downloads",
];

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-8 pb-16">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--secondary)/0.1),transparent_50%)]" />
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-[10%] w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 blur-sm animate-pulse" />
        <div className="absolute top-1/3 right-[15%] w-16 h-16 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 blur-sm animate-pulse delay-700" />
        <div className="absolute bottom-1/3 left-[20%] w-12 h-12 rounded-lg bg-gradient-to-br from-primary/15 to-secondary/15 blur-sm animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  The Creator Economy Platform
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[3.5rem] xl:text-6xl font-bold leading-[1.1] mb-6">
                Discover, Buy & Sell{" "}
                <span className="gradient-text">Clips, Tools & Digital Products</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                The all-in-one marketplace for creators. Access premium clips, digital downloads, 
                courses, and tools—or sell your own and earn instantly.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-8">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/marketplace">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Explore Marketplace
                  </Link>
                </Button>
                <Button variant="heroOutline" size="xl" asChild>
                  <Link to="/auth?mode=signup">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                {trustBadges.map((badge) => (
                  <div key={badge} className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>{badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual - Marketplace Preview */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main Card */}
                <div className="glass-card rounded-3xl p-6 border border-border/50 shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">Live Marketplace</p>
                        <p className="text-xs text-muted-foreground">Updated just now</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-success text-sm">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <span>Live</span>
                    </div>
                  </div>

                  {/* Product Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { title: "Premium Clip Pack", price: "$29", color: "from-blue-500 to-purple-500" },
                      { title: "Editing Course", price: "$49", color: "from-orange-500 to-pink-500" },
                      { title: "Sound FX Bundle", price: "$19", color: "from-green-500 to-teal-500" },
                      { title: "Preset Collection", price: "$39", color: "from-purple-500 to-indigo-500" },
                    ].map((product, i) => (
                      <div key={i} className="bg-muted/50 rounded-xl p-3 hover:bg-muted/70 transition-colors cursor-pointer">
                        <div className={`w-full h-16 rounded-lg bg-gradient-to-br ${product.color} mb-2 flex items-center justify-center`}>
                          <Download className="w-6 h-6 text-white/80" />
                        </div>
                        <p className="text-xs font-medium truncate">{product.title}</p>
                        <p className="text-xs text-primary font-bold">{product.price}</p>
                      </div>
                    ))}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
                    <div className="text-center">
                      <p className="font-display text-xl font-bold gradient-text">$2M+</p>
                      <p className="text-[10px] text-muted-foreground">Creator Earnings</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-xl font-bold gradient-text">50K+</p>
                      <p className="text-[10px] text-muted-foreground">Products Sold</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-xl font-bold gradient-text">10K+</p>
                      <p className="text-[10px] text-muted-foreground">Active Creators</p>
                    </div>
                  </div>
                </div>

                {/* Floating Notification Cards */}
                <div className="absolute -top-4 -right-4 bg-card border border-border rounded-xl p-3 shadow-lg animate-bounce-slow">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">New Sale!</p>
                      <p className="text-[10px] text-muted-foreground">+$49 earned</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">12 buyers online</p>
                      <p className="text-[10px] text-muted-foreground">Right now</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12 lg:hidden max-w-md mx-auto">
            {[
              { value: "$2M+", label: "Creator Earnings" },
              { value: "50K+", label: "Products Sold" },
              { value: "10K+", label: "Active Creators" },
            ].map((stat) => (
              <div key={stat.label} className="text-center glass-card rounded-xl p-4">
                <p className="font-display text-xl font-bold gradient-text">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom animation */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
