import { Link } from "react-router-dom";
import { ArrowRight, Play, Star, Zap, TrendingUp, Wallet, ShieldCheck } from "lucide-react";

const stats = [
  { value: "$50K+", label: "Paid out" },
  { value: "5,000+", label: "Creators" },
  { value: "10M+", label: "Views" },
  { value: "100+", label: "Campaigns" },
];

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden hero-gradient grain">
      {/* Grid backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground)/0.045)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.045)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_50%_0%,black_20%,transparent_75%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-28 pb-20">
        {/* Headline block */}
        <div className="max-w-4xl mb-10">
          <span className="editorial-eyebrow mb-6 inline-flex">Creator rewards · Vol. 01</span>
          <h1
            className="display-serif text-balance text-foreground mb-6"
            style={{ fontSize: "clamp(2.75rem, 7.5vw, 6rem)" }}
          >
            Your content,
            <br />
            <span className="display-italic text-primary">your</span> earnings.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
            Post clips, go viral, get paid for every view. No upfront fees, no gatekeeping —
            just campaigns from real brands and instant payouts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/auth?mode=signup" className="btn-ink group">
              Start earning
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/campaigns" className="btn-ghost-ink">
              <Play className="w-4 h-4 mr-2" />
              Browse campaigns
            </Link>
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Big earnings tile */}
          <div className="bento-tile tile-accent md:col-span-2 lg:col-span-2 md:row-span-2 flex flex-col justify-between min-h-[260px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Total creator payouts
              </span>
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="display-serif text-6xl md:text-7xl text-foreground leading-none mb-2">
                $50K+
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Paid straight to creators across TikTok, Reels and Shorts campaigns.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-4 border-t border-border/70">
              <div className="flex -space-x-2">
                {["JM", "SJ", "AV", "RP"].map((a) => (
                  <div
                    key={a}
                    className="w-7 h-7 rounded-full bg-secondary text-foreground flex items-center justify-center text-[10px] font-semibold border border-border"
                  >
                    {a}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">5,000+ creators</span>
              </div>
            </div>
          </div>

          {/* Rate tile */}
          <div className="bento-tile flex flex-col justify-between min-h-[124px]">
            <Zap className="w-4 h-4 text-primary" />
            <div>
              <div className="display-serif text-4xl text-foreground leading-none">$1–5</div>
              <p className="text-xs text-muted-foreground mt-1">per 1,000 views</p>
            </div>
          </div>

          {/* Payout speed */}
          <div className="bento-tile flex flex-col justify-between min-h-[124px]">
            <TrendingUp className="w-4 h-4 text-primary" />
            <div>
              <div className="display-serif text-4xl text-foreground leading-none">24h</div>
              <p className="text-xs text-muted-foreground mt-1">average payout time</p>
            </div>
          </div>

          {/* Trust tile */}
          <div className="bento-tile lg:col-span-2 flex items-center gap-4 min-h-[124px]">
            <div className="w-10 h-10 rounded-xl bg-primary/12 border border-primary/25 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Secure, transparent payments</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track every view and every rupee in real time. No hidden cuts.
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="bento-tile md:col-span-3 lg:col-span-4 !p-0 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center justify-center py-7 px-4">
                  <span className="display-serif text-3xl md:text-4xl text-foreground mb-1">
                    {s.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
