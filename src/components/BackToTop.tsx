import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40 h-11 w-11 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl animate-fade-in"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
};
