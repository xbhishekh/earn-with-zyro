import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  HelpCircle, 
  Clock, 
  Shield, 
  CreditCard, 
  Users, 
  Video, 
  Loader2,
  Zap,
  ChevronRight,
  Mail,
  Headphones
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
}

const CATEGORY_ICONS: Record<string, any> = {
  "Getting Started": HelpCircle,
  "Campaigns & Submissions": Video,
  "Payments & Earnings": CreditCard,
  "Affiliate Program": Users,
  "Account & Security": Shield,
  "General": HelpCircle,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Getting Started": "from-blue-500/20 to-blue-600/20 border-blue-500/30",
  "Campaigns & Submissions": "from-purple-500/20 to-purple-600/20 border-purple-500/30",
  "Payments & Earnings": "from-green-500/20 to-green-600/20 border-green-500/30",
  "Affiliate Program": "from-orange-500/20 to-orange-600/20 border-orange-500/30",
  "Account & Security": "from-red-500/20 to-red-600/20 border-red-500/30",
  "General": "from-gray-500/20 to-gray-600/20 border-gray-500/30",
};

const Support = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const { data } = await supabase
        .from("faqs")
        .select("id, category, question, answer, sort_order")
        .eq("is_active", true)
        .order("category")
        .order("sort_order");

      if (data) setFaqs(data);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    if (user) {
      // Trigger the floating support chat widget by dispatching a custom event
      window.dispatchEvent(new CustomEvent('open-support-chat'));
    } else {
      navigate("/auth");
    }
  };

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const categories = Object.keys(groupedFaqs);
  const displayFaqs = selectedCategory 
    ? { [selectedCategory]: groupedFaqs[selectedCategory] } 
    : groupedFaqs;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center mb-12"
          >
            <div className="w-20 h-20 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Headphones className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Help <span className="gradient-text">Centre</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Find answers to common questions or chat with our support team for personalized help.
            </p>
            <Button 
              size="lg" 
              onClick={handleStartChat}
              className="gradient-bg hover:opacity-90 text-white px-8"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Live Chat
            </Button>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto"
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Quick Response</p>
                  <p className="text-sm text-muted-foreground">Usually within minutes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-success/20 bg-gradient-to-br from-success/5 to-success/10">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="font-semibold">Live Chat</p>
                  <p className="text-sm text-muted-foreground">Real-time support</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold">24/7 Available</p>
                  <p className="text-sm text-muted-foreground">We're always here</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-2 justify-center mb-8"
            >
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Topics
              </Button>
              {categories.map((category) => {
                const IconComponent = CATEGORY_ICONS[category] || HelpCircle;
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <IconComponent className="w-4 h-4 mr-1" />
                    {category}
                  </Button>
                );
              })}
            </motion.div>
          )}

          {/* FAQs Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground">
                Browse through our most common questions
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : Object.keys(displayFaqs).length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No FAQs available yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(displayFaqs).map(([category, categoryFaqs]) => {
                  const IconComponent = CATEGORY_ICONS[category] || HelpCircle;
                  const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS["General"];
                  
                  return (
                    <motion.div 
                      key={category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center border`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-lg">{category}</h3>
                          <p className="text-sm text-muted-foreground">{categoryFaqs.length} questions</p>
                        </div>
                      </div>
                      
                      <Card className="overflow-hidden">
                        <Accordion type="single" collapsible className="w-full">
                          {categoryFaqs.map((faq, index) => (
                            <AccordionItem key={faq.id} value={faq.id} className="border-b last:border-0">
                              <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors text-left">
                                <span className="pr-4">{faq.question}</span>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-4 pt-0">
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {faq.answer}
                                </p>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Still Need Help Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card border-primary/20 max-w-2xl mx-auto overflow-hidden">
              <div className="gradient-bg p-8 text-center text-white">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-90" />
                <h3 className="font-display text-2xl font-bold mb-2">Still need help?</h3>
                <p className="text-white/80 mb-6">
                  Our support team is ready to assist you with any questions or issues.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    variant="secondary"
                    onClick={handleStartChat}
                    className="bg-white text-primary hover:bg-white/90"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chat with Support
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    onClick={() => window.location.href = "mailto:support@zyrozo.com"}
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Email Us
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
