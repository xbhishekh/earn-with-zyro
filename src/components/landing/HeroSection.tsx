import { Link } from "react-router-dom";
import { ArrowRight, Play, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient blob */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 via-orange-500/15 to-transparent rounded-full blur-3xl animate-pulse" />
        {/* Secondary gradient blob */}
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-purple-500/15 via-primary/10 to-transparent rounded-full blur-3xl" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-20 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">#1 Creator Rewards Platform</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
            Your Content,{" "}
            <span className="relative">
              <span className="gradient-text">Your Earnings</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M2 6C50 2 150 2 198 6" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="hsl(var(--primary))" />
                    <stop offset="1" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Join thousands of creators earning real money. Post clips, go viral, and get paid for every view. Simple as that.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button variant="hero" size="xl" asChild className="shadow-lg shadow-primary/25">
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

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-primary mb-1">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-2xl md:text-3xl font-bold text-foreground">$50K+</span>
              <span className="text-sm text-muted-foreground">Paid Out</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-2xl md:text-3xl font-bold text-foreground">5K+</span>
              <span className="text-sm text-muted-foreground">Creators</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-2xl md:text-3xl font-bold text-foreground">10M+</span>
              <span className="text-sm text-muted-foreground">Views</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-2xl md:text-3xl font-bold text-foreground">100+</span>
              <span className="text-sm text-muted-foreground">Campaigns</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
