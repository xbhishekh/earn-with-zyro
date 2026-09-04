import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Star, CheckCircle2, Activity, TrendingUp, Zap, ShieldCheck } from "lucide-react";

const stats = [
  { icon: Activity, value: "$50K+", label: "Paid to creators" },
  { icon: TrendingUp, value: "5,000+", label: "Active creators" },
  { icon: Zap, value: "10M+", label: "Views tracked" },
  { icon: ShieldCheck, value: "24h", label: "Avg. payout time" },
];

const perks = ["No credit card", "All features included", "Setup in seconds"];

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden hero-gradient">
      <div className="container mx-auto px-4 relative z-10 pt-20 pb-16 md:pt-24 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <span className="editorial-eyebrow mb-8">v1.0 — Creator rewards, made simple</span>

          <h1
            className="display-serif text-balance text-foreground mb-6"
            style={{ fontSize: "clamp(2.5rem, 6.5vw, 5rem)" }}
          >
            Your content,
            <br />
            <span className="display-italic">your earnings.</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-9">
            Post clips, go viral, get paid for every view. Real brand campaigns,
            transparent tracking and instant payouts — zero upfront fees, ever.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?mode=signup" className="btn-ink group">
              Start earning free
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/campaigns" className="btn-ghost-ink group">
              Browse campaigns
              <ChevronRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {perks.map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                {p}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </span>
              <strong className="text-foreground font-bold">4.9/5</strong>
              <span className="text-muted-foreground">· 5,000+ creators</span>
            </span>
            <span className="hidden sm:block h-5 w-px bg-border" />
            <span className="text-muted-foreground">
              <strong className="text-foreground font-bold">$50,000+</strong> paid out
            </span>
          </div>
        </div>

        {/* Stats band */}
        <div className="mt-16 max-w-5xl mx-auto stats-band rounded-[2rem] px-6 py-12 md:px-12 relative overflow-hidden">
          <span className="editorial-eyebrow mb-10 flex justify-center">The Cliperus standard</span>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col items-center text-center px-4 py-6 md:py-2 ${i > 0 ? "md:border-l stat-divider" : ""} ${i >= 2 ? "max-md:border-t stat-divider" : ""} ${i % 2 === 1 ? "max-md:border-l stat-divider" : ""}`}
              >
                <span className="stat-icon w-11 h-11 rounded-2xl flex items-center justify-center mb-4">
                  <s.icon className="w-5 h-5" />
                </span>
                <span className="stat-value display-serif text-3xl md:text-4xl">{s.value}</span>
                <span className="stat-label text-xs md:text-sm font-medium uppercase tracking-wider mt-2">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t stat-divider text-center">
            <span className="stat-label text-[11px] font-semibold uppercase tracking-[0.24em]">
              Works across every major platform
            </span>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold">
              {["TikTok", "Instagram Reels", "YouTube Shorts", "X", "Snapchat"].map((p) => (
                <span key={p} className="platform-name">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
