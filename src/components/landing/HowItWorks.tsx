import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const steps = [
  {
    no: "I.",
    title: "Pick a campaign",
    description: "Browse a curated rotation of brand briefs. Filter by payout rate, niche, or platform. Apply in one click.",
    meta: "Avg. brief: 90 seconds to read",
  },
  {
    no: "II.",
    title: "Make the clip",
    description: "Use the brand's assets — or your own footage. Stay on-brief, stay original. The editorial guidelines tell you exactly what works.",
    meta: "Drop clips from TikTok, Reels, Shorts, X",
  },
  {
    no: "III.",
    title: "Get paid for views",
    description: "Submit the link. We track the views, calculate the payout, and credit your balance. Withdraw whenever.",
    meta: "Released after 72-hour view verification",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 md:py-32 bg-secondary/30 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mb-16">
          <span className="editorial-eyebrow mb-6 block">Chapter II · The Process</span>
          <h2 className="display-serif text-foreground" style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)" }}>
            Three steps, <span className="display-italic">no theatrics.</span>
          </h2>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {steps.map((s) => (
            <div
              key={s.title}
              className="group grid grid-cols-12 gap-6 py-10 md:py-14 px-2 md:px-4 hover:bg-background/60 transition-colors duration-500"
            >
              <div className="col-span-2 md:col-span-1">
                <span className="display-serif text-3xl md:text-4xl text-primary/60">{s.no}</span>
              </div>
              <div className="col-span-10 md:col-span-6">
                <h3 className="display-serif text-3xl md:text-5xl text-foreground mb-3 leading-tight">
                  {s.title}
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
                  {s.description}
                </p>
              </div>
              <div className="col-span-12 md:col-span-5 md:text-right flex md:justify-end items-start">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{s.meta}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link to="/campaigns" className="btn-ink group">
            See live campaigns
            <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
