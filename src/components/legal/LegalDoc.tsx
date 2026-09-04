import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

// Renders inline **bold** markers inside a line
const renderInline = (text: string) => {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-foreground font-semibold">{part}</strong> : part
  );
};

interface LegalDocProps {
  title: string;
  description: string;
  canonical: string;
  pageType: string;
  defaultContent: string;
}

export const LegalDoc = ({ title, description, canonical, pageType, defaultContent }: LegalDocProps) => {
  const [content, setContent] = useState<string>(defaultContent);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("legal_pages")
        .select("content")
        .eq("page_type", pageType)
        .maybeSingle();
      if (!cancelled && data?.content && data.content.trim()) {
        setContent(data.content);
      }
    })();
    return () => { cancelled = true; };
  }, [pageType]);

  return (
    <div className="min-h-screen bg-background">
      <SEO title={title} description={description} canonical={canonical} />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="glass-card rounded-2xl p-8 md:p-12">
              <div className="prose prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground max-w-none">
                {content.split('\n').map((line, index) => {
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={index} className="font-display text-3xl font-bold gradient-text mb-2">
                        {line.replace('# ', '')}
                      </h1>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={index} className="font-display text-xl font-bold mt-8 mb-4">
                        {line.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={index} className="text-sm text-muted-foreground mb-6">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <li key={index} className="ml-4">
                        {renderInline(line.replace('- ', ''))}
                      </li>
                    );
                  }
                  if (line.trim()) {
                    return <p key={index} className="mb-4">{renderInline(line)}</p>;
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
