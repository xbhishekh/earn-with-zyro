import { Link } from "react-router-dom";
import { ArrowRight, Share2, UserPlus, Wallet, Check } from "lucide-react";

const steps = [
  {
    icon: Share2,
    step: "01",
    title: "Share your link",
    description: "Every account comes with a unique referral link. Drop it in your bio, story or Discord.",
  },
  {
    icon: UserPlus,
    step: "02",
    title: "They join free",
    description: "Anyone who signs up through your link is tracked to you automatically — forever.",
  },
  {
    icon: Wallet,
    step: "03",
    title: "You get paid",
    description: "$5 the moment they're verified, plus 10% of everything they earn. No cap.",
  },
];

const perks = [
  "Unlimited referrals",
  "Lifetime 10% commission",
  "Live tracking dashboard",
  "Paid straight to your wallet",
];

export const AffiliateCTA = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden border-t border-border">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_20%_0%,hsl(var(--primary)/0.10),transparent_60%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="max-w-3xl">
            <span className="editorial-eyebrow text-[11px] uppercase tracking-[0.22em] text-primary">
              Referral program
            </span>
            <h2
              className="display-serif text-balance mt-5 mb-5"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
            >
              Bring a creator,{" "}
              <span className="display-italic text-primary">keep earning</span> from them.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              CliporaX pays you twice: once when a creator joins with your link, and again every
              single time they get paid.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mt-14">
            {steps.map((s) => (
              <div
                key={s.step}
                className="group relative rounded-2xl border border-border bg-card p-6 md:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_50px_-24px_hsl(var(--primary)/0.5)]"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold mb-2 tracking-tight">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>

          {/* Payout band */}
          <div className="mt-6 rounded-2xl border border-border bg-secondary/60 overflow-hidden">
            <div className="grid lg:grid-cols-[1.15fr_1fr]">
              <div className="p-7 md:p-10 border-b lg:border-b-0 lg:border-r border-border">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
                  What the maths looks like
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "$5", label: "Per verified signup" },
                    { value: "10%", label: "Of their earnings" },
                    { value: "∞", label: "Referral limit" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="display-serif text-primary leading-none text-3xl md:text-4xl">
                        {stat.value}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 leading-snug">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <span className="text-xs text-muted-foreground shrink-0">Your link</span>
                  <code className="text-xs md:text-sm font-mono text-foreground truncate">
                    cliporax.com/?ref=yourname
                  </code>
                </div>
              </div>

              <div className="p-7 md:p-10 flex flex-col justify-between">
                <ul className="space-y-3.5">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/12 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </span>
                      <span className="text-foreground/90">{perk}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/affiliate"
                  className="mt-8 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm font-bold tracking-tight transition-all duration-300 hover:shadow-[0_0_36px_-6px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5 group"
                >
                  Get my referral link
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
