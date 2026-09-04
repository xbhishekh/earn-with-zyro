import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Jake Mitchell",
    role: "Clip editor · 1.2M views",
    quote: "Cliperus doubled my monthly income in two months. The dashboard is the cleanest thing I've used — it just respects your time.",
    avatar: "JM",
    payout: "$2,840",
  },
  {
    name: "Sarah Johnson",
    role: "TikTok creator · 4.6M views",
    quote: "I was tired of pitching brands. Here the campaigns come pre-vetted. Pick one, ship a clip, see the money land.",
    avatar: "SJ",
    payout: "$5,120",
  },
  {
    name: "Aman Verma",
    role: "Reels creator · 2.1M views",
    quote: "Payouts are actually on time. Support replies. The whole thing feels designed by someone who's been on the creator side.",
    avatar: "AV",
    payout: "$3,460",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 md:py-32 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mb-16">
          <span className="editorial-eyebrow mb-6 block">Chapter III · The Receipts</span>
          <h2 className="display-serif text-foreground" style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)" }}>
            What creators are <span className="display-italic">actually</span> saying.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <figure
              key={t.name}
              className={`group relative bg-secondary/40 border border-border p-8 md:p-10 transition-all duration-500 hover:bg-background hover:shadow-[var(--shadow-lift)] hover:-translate-y-1 ${i === 1 ? "md:translate-y-6" : ""}`}
            >
              <Quote className="absolute top-6 right-6 w-6 h-6 text-foreground/15" strokeWidth={1.5} />

              <blockquote className="display-serif text-2xl md:text-[26px] text-foreground leading-snug mb-8">
                "{t.quote}"
              </blockquote>

              <figcaption className="flex items-center justify-between pt-6 border-t border-border/80">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-xs font-semibold tracking-wider">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-3">
                  <p className="display-serif text-xl text-primary">{t.payout}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">last 30d</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
