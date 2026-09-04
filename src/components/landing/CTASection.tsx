import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="relative py-24 md:py-32 bg-secondary text-foreground overflow-hidden border-y border-border">
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

          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Join thousands of creators turning views into income. No application fee. No subscription. Just craft and get paid.
          </p>

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

          <p className="mt-10 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/60">
            Free forever · Withdraw anytime · Built by creators
          </p>
        </div>
      </div>
    </section>
  );
};
