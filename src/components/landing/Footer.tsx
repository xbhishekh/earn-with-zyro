import { forwardRef } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.jpeg";

const footerLinks = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
  { name: "Help & Support", href: "/support" },
  { name: "Contact", href: "/contact" },
];

export const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>((props, ref) => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="Zyrozo" 
              className="w-9 h-9 rounded-xl object-contain"
            />
            <span className="font-display font-bold text-lg gradient-text">
              Zyrozo
            </span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Zyrozo
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
