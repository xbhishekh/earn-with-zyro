import { Link } from "react-router-dom";
import { ArrowRight, Gift, Scissors, Wallet } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden border-y border-border bg-secondary">
      {/* Mint glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-32 -left-24 w-[420px] h-[320px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute -bottom-32 -right-24 w-[420px] h-[320px] rounded-full bg-primary/8 blur-[100px]" />
      </div>

      {/* Editorial grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-8">
            <span className="h-px w-8 bg-primary/60" />
            Start free today
            <span className="h-px w-8 bg-primary/60" />
          </span>

          <h2 className="display-serif text-balance mb-8" style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.25rem)" }}>
            Your next clip
            <br />
            <span className="display-italic text-primary">could be your paycheck.</span>
          </h2>

          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Join thousands of creators turning views into income. No application fee. No subscription. Just craft and get paid.
          </p>

          {/* Mini value chips */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
            {[
              { icon: Scissors, label: "Get paid per clip" },
              { icon: Gift, label: "$5 per referral + 10% forever" },
              { icon: Wallet, label: "Withdraw anytime" },
            ].map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-2 text-xs font-semibold text-foreground shadow-sm"
              >
                <c.icon className="w-3.5 h-3.5 text-primary" />
                {c.label}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-8 py-4 text-sm font-bold tracking-tight transition-all duration-300 hover:shadow-[0_0_36px_-6px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5 group"
            >
              Create my account
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/campaigns"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card text-foreground px-8 py-4 text-sm font-semibold tracking-tight transition-all duration-300 hover:border-primary/30 shadow-[var(--shadow-elegant)]"
            >
              Browse campaigns
            </Link>
          </div>

          {/* Referral hint */}
          <p className="mt-8 text-sm text-muted-foreground">
            Already signed up?{" "}
            <Link to="/affiliate" className="font-semibold text-primary underline-offset-4 hover:underline">
              Grab your referral link
            </Link>{" "}
            and earn from every creator you bring in.
          </p>

          <p className="mt-8 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Free forever · Withdraw anytime · Built by creators
          </p>
        </div>
      </div>
    </section>
  );
};
