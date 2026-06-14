import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="relative py-28 md:py-40 bg-foreground text-background overflow-hidden grain">
      {/* Editorial grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[linear-gradient(hsl(var(--background))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--background))_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-background/60 mb-8">
            <span className="h-px w-8 bg-background/40" />
            Issue No. 01 · 2026
            <span className="h-px w-8 bg-background/40" />
          </span>

          <h2 className="display-serif text-balance mb-8" style={{ fontSize: "clamp(2.75rem, 7vw, 6rem)" }}>
            Your next clip
            <br />
            <span className="display-italic text-background/70">could be your paycheck.</span>
          </h2>

          <p className="text-background/70 text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Join thousands of creators turning views into income. No application fee. No subscription. Just craft and get paid.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center justify-center rounded-md bg-background text-foreground px-8 py-4 text-sm font-medium tracking-tight transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 group"
            >
              Create my account
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/campaigns"
              className="inline-flex items-center justify-center rounded-md border border-background/20 bg-transparent text-background px-8 py-4 text-sm font-medium tracking-tight transition-all duration-300 hover:bg-background/10"
            >
              Browse campaigns
            </Link>
          </div>

          <p className="mt-10 text-[11px] uppercase tracking-[0.22em] text-background/40">
            Free forever · Withdraw anytime · Built by creators
          </p>
        </div>
      </div>
    </section>
  );
};
