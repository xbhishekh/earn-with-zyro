import { Link } from "react-router-dom";
import { ArrowRight, Play, Star } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden hero-gradient grain">
      {/* Editorial backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground)/0.04)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.04)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Eyebrow */}
          <div className="flex justify-center mb-10 animate-fade-in">
            <span className="editorial-eyebrow">A Creator Rewards Quarterly · Vol. 01</span>
          </div>

          {/* Display headline */}
          <h1 className="display-serif text-center text-balance text-foreground mb-8 animate-fade-in" style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}>
            Your content,
            <br />
            <span className="display-italic text-muted-foreground">your</span>{" "}
            earnings.
          </h1>

          {/* Subtitle */}
          <p className="text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-light animate-fade-in">
            A quiet, considered platform for creators who want to be paid for the work — not the noise. Post clips, go viral, get paid for every view.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 animate-fade-in">
            <Link to="/auth?mode=signup" className="btn-ink group">
              Start earning
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/campaigns" className="btn-ghost-ink">
              <Play className="w-4 h-4 mr-2" />
              Browse campaigns
            </Link>
          </div>

          {/* Social proof row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in">
            <div className="flex -space-x-2">
              {["JM", "SJ", "AV", "RP"].map((a) => (
                <div key={a} className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-medium border-2 border-background">
                  {a}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-foreground text-foreground" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Loved by 5,000+ creators</span>
            </div>
          </div>

          {/* Stats — editorial divided row */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-border/80 divide-y md:divide-y-0 md:divide-x divide-border/80 animate-fade-in">
            {[
              { value: "$50K+", label: "Paid out" },
              { value: "5,000+", label: "Creators" },
              { value: "10M+", label: "Views" },
              { value: "100+", label: "Campaigns" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center py-8 px-4">
                <span className="display-serif text-4xl md:text-5xl text-foreground mb-1">{stat.value}</span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
