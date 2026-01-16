import { Link } from "react-router-dom";
import { ArrowRight, Play, Star, TrendingUp, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { icon: TrendingUp, value: "$500K+", label: "Paid to Creators" },
  { icon: Users, value: "5,000+", label: "Active Creators" },
  { icon: Star, value: "100+", label: "Brand Campaigns" },
];

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full mb-8 shadow-sm">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground font-medium">
              India's #1 Creator Rewards Platform
            </span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Your Content,{" "}
            <span className="gradient-text">Your Earnings</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join top brands, create viral content, and get paid for every view.
            Turn your creativity into a sustainable income stream.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Start Earning Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/campaigns">
                <Play className="w-5 h-5 mr-2" />
                Browse Campaigns
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <stat.icon className="w-4 h-4 text-primary" />
                  <span className="font-display text-xl md:text-2xl font-bold gradient-text">
                    {stat.value}
                  </span>
                </div>
                <span className="text-xs md:text-sm text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
