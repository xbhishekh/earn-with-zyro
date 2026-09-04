import { Zap, Coins, ShieldCheck, BarChart3, Globe2, Sparkles } from "lucide-react";

const features = [
  {
    no: "01",
    icon: Coins,
    title: "Paid per view",
    description: "Every 1,000 views turns into real money. No follower gates, no waiting list — just performance-based rewards.",
  },
  {
    no: "02",
    icon: Zap,
    title: "Instant balance",
    description: "Earnings land in your balance the moment a clip ships. Withdraw whenever you want with full transparency.",
  },
  {
    no: "03",
    icon: ShieldCheck,
    title: "Verified brands only",
    description: "Every campaign is manually reviewed. You only spend time on content from brands that actually pay out.",
  },
  {
    no: "04",
    icon: BarChart3,
    title: "Native analytics",
    description: "See views, earnings and ranking per clip in one editorial dashboard. No spreadsheets, no guesswork.",
  },
  {
    no: "05",
    icon: Globe2,
    title: "Multi-platform",
    description: "TikTok, Reels, Shorts, X — submit clips from anywhere. We track the views, you keep creating.",
  },
  {
    no: "06",
    icon: Sparkles,
    title: "Affiliate engine",
    description: "Invite other creators, earn lifetime commission on their payouts. Built-in growth, no extra tooling.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 md:py-32 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 md:mb-20">
          <span className="editorial-eyebrow mb-6 block">Chapter I · The Platform</span>
          <h2 className="display-serif text-foreground mb-6" style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)" }}>
            Built for creators who treat content <span className="display-italic">like a craft.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            Every detail is engineered to remove friction between your work and your paycheck.
          </p>
        </div>

        {/* Features Grid — editorial bordered cells */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-border">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative border-r border-b border-border p-8 md:p-10 bg-background hover:bg-secondary/40 transition-colors duration-500"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="display-serif text-3xl text-muted-foreground/60">{feature.no}</span>
                <feature.icon className="w-5 h-5 text-foreground/70 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110" strokeWidth={1.5} />
              </div>
              <h3 className="display-serif text-2xl md:text-3xl text-foreground mb-3 leading-tight">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
              {/* hover hairline */}
              <span className="absolute left-0 bottom-0 h-px w-0 bg-foreground transition-all duration-500 group-hover:w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
