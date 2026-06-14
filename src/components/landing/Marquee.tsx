import { Sparkle } from "lucide-react";

const items = [
  "Pay-per-view rewards",
  "Verified creators",
  "Instant payouts",
  "TikTok · Reels · Shorts",
  "10M+ views tracked",
  "Built in 2026",
  "No upfront fees",
  "Transparent earnings",
];

export const Marquee = () => {
  return (
    <section className="border-y border-border bg-secondary/40 overflow-hidden">
      <div className="relative flex py-5">
        <div className="flex shrink-0 animate-[marquee_38s_linear_infinite] items-center gap-12 pr-12 whitespace-nowrap">
          {[...items, ...items].map((t, i) => (
            <span key={i} className="flex items-center gap-3 text-sm uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkle className="w-3 h-3 text-foreground/60" />
              <span className="display-italic text-foreground/80 text-base normal-case tracking-normal">{t}</span>
            </span>
          ))}
        </div>
        <div aria-hidden className="flex shrink-0 animate-[marquee_38s_linear_infinite] items-center gap-12 pr-12 whitespace-nowrap">
          {[...items, ...items].map((t, i) => (
            <span key={`b-${i}`} className="flex items-center gap-3 text-sm uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkle className="w-3 h-3 text-foreground/60" />
              <span className="display-italic text-foreground/80 text-base normal-case tracking-normal">{t}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
