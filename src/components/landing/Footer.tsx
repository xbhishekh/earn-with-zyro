import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Instagram, Youtube, Twitter, Mail, ShieldCheck, ArrowUpRight } from "lucide-react";
import logo from "@/assets/cliporax-mark.png";

const columns = [
  {
    title: "Platform",
    links: [
      { name: "Campaigns", href: "/campaigns" },
      { name: "Marketplace", href: "/marketplace" },
      { name: "Affiliate Program", href: "/affiliate" },
      { name: "Pricing", href: "/pricing" },
      { name: "For Business", href: "/business" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
      { name: "Help & Support", href: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Refund Policy", href: "/refund" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Security", href: "/security" },
    ],
  },
];

const socials = [
  { name: "Instagram", href: "https://instagram.com", icon: Instagram },
  { name: "YouTube", href: "https://youtube.com", icon: Youtube },
  { name: "X", href: "https://x.com", icon: Twitter },
  { name: "Email", href: "mailto:support@cliporax.com", icon: Mail },
];

export const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>((props, ref) => {
  return (
    <footer ref={ref} {...props} className="relative border-t border-border bg-card overflow-hidden">
      {/* subtle top glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4">
            <Link to="/" className="flex items-center gap-2.5 w-fit">
              <img
                src={logo}
                alt="CliporaX"
                className="w-10 h-10 rounded-xl object-contain"
              />
              <span className="font-display font-extrabold text-xl text-primary tracking-tight">
                CliporaX
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
              The creator rewards platform. Post clips, grow on every major
              platform, and get paid for real, verified views — no fees, ever.
            </p>

            <div className="mt-5 flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Secure payouts · Verified views</span>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact mini-card */}
          <div className="col-span-2 md:col-span-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground mb-4">
              Get in touch
            </h3>
            <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
              <a
                href="mailto:support@cliporax.com"
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                support@cliporax.com
              </a>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Average response time under 24 hours, 7 days a week.
              </p>
              <Link
                to="/support"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                Visit Help Center
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CliporaX. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for creators · Paid for views · Trusted worldwide
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
