import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarCheck,
  Loader2,
  Rocket,
  Target,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { toast } from "sonner";

const inquirySchema = z.object({
  company_name: z.string().trim().min(2, "Company name is required").max(120),
  contact_name: z.string().trim().min(2, "Your name is required").max(120),
  email: z.string().trim().email("Enter a valid work email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  budget_range: z.string().max(60).optional().or(z.literal("")),
  campaign_goal: z.string().max(120).optional().or(z.literal("")),
  preferred_call_time: z.string().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(3000).optional().or(z.literal("")),
});

const budgets = ["Under $500", "$500 – $2,000", "$2,000 – $10,000", "$10,000 – $50,000", "$50,000+"];
const goals = [
  "Launch a clipping campaign",
  "Grow brand awareness",
  "Promote a product launch",
  "Recruit creators / clippers",
  "Something else",
];

const perks = [
  { icon: Users, title: "Vetted clipper network", desc: "Thousands of editors ready to push your content." },
  { icon: Target, title: "Pay for performance", desc: "You only pay for the views your clips actually earn." },
  { icon: BarChart3, title: "Live analytics", desc: "Track views, submissions and spend in one dashboard." },
  { icon: Rocket, title: "Launch in 48 hours", desc: "We set up your campaign brief, rates and assets." },
];

const Business = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    budget_range: "",
    campaign_goal: "",
    preferred_call_time: "",
    message: "",
  });

  const set = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = inquirySchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("business_inquiries").insert({
        company_name: parsed.data.company_name,
        contact_name: parsed.data.contact_name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        website: parsed.data.website || null,
        budget_range: parsed.data.budget_range || null,
        campaign_goal: parsed.data.campaign_goal || null,
        preferred_call_time: parsed.data.preferred_call_time || null,
        message: parsed.data.message || null,
        user_id: user?.id ?? null,
      });
      if (error) throw error;
      setDone(true);
      toast.success("Request received! Our team will reach out shortly.");
    } catch (err) {
      console.error(err);
      toast.error("Could not submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="For Business — Book a Campaign Call | CliporaX"
        description="Launch a pay-per-view clipping campaign with CliporaX. Tell us your goals and book a call with our campaign team."
      />
      <Navbar />

      <main className="pt-24 md:pt-32 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Building2 className="w-4 h-4" /> Business side
            </span>
            <h1 className="mt-6 font-display text-4xl md:text-6xl font-bold leading-tight">
              Get your brand clipped <span className="gradient-text">everywhere</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Tell us what you want to promote and book a call. Our team builds the campaign, sets the
              rates and puts thousands of clippers to work for you.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="rounded-full">
                <a href="#book-call">
                  <CalendarCheck className="w-4 h-4 mr-2" /> Book a call
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full">
                <Link to="/">
                  I'm a clipper <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Perks */}
        <section className="container mx-auto px-4 mt-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {perks.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="h-full border-border/60">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <p.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1.5">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Form */}
        <section id="book-call" className="container mx-auto px-4 mt-20 scroll-mt-24">
          <div className="max-w-3xl mx-auto">
            <Card className="border-border/60">
              <CardContent className="p-6 md:p-10">
                {done ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-2">Request submitted</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Our campaign team has your details and will email you within 24 hours to schedule
                      the call.
                    </p>
                    <Button variant="outline" className="mt-6 rounded-full" asChild>
                      <Link to="/">Back to home</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-2xl md:text-3xl font-bold">Tell us about your campaign</h2>
                    <p className="text-muted-foreground mt-2 mb-8">
                      Fill this in and our team reviews it directly — no bots, no ticket queue.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="company_name">Company / brand *</Label>
                          <Input
                            id="company_name"
                            value={form.company_name}
                            onChange={(e) => set("company_name", e.target.value)}
                            placeholder="Acme Media"
                            maxLength={120}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_name">Your name *</Label>
                          <Input
                            id="contact_name"
                            value={form.contact_name}
                            onChange={(e) => set("contact_name", e.target.value)}
                            placeholder="Firoz Saleem"
                            maxLength={120}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Work email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => set("email", e.target.value)}
                            placeholder="you@company.com"
                            maxLength={255}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone / WhatsApp</Label>
                          <Input
                            id="phone"
                            value={form.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            placeholder="+91 90000 00000"
                            maxLength={30}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website / social link</Label>
                          <Input
                            id="website"
                            value={form.website}
                            onChange={(e) => set("website", e.target.value)}
                            placeholder="https://"
                            maxLength={200}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="preferred_call_time">Preferred call time</Label>
                          <Input
                            id="preferred_call_time"
                            value={form.preferred_call_time}
                            onChange={(e) => set("preferred_call_time", e.target.value)}
                            placeholder="Weekdays, 4–6 PM IST"
                            maxLength={120}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Campaign goal</Label>
                          <Select value={form.campaign_goal} onValueChange={(v) => set("campaign_goal", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="What do you want to achieve?" />
                            </SelectTrigger>
                            <SelectContent>
                              {goals.map((g) => (
                                <SelectItem key={g} value={g}>
                                  {g}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Monthly budget</Label>
                          <Select value={form.budget_range} onValueChange={(v) => set("budget_range", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a range" />
                            </SelectTrigger>
                            <SelectContent>
                              {budgets.map((b) => (
                                <SelectItem key={b} value={b}>
                                  {b}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Anything else?</Label>
                        <Textarea
                          id="message"
                          value={form.message}
                          onChange={(e) => set("message", e.target.value)}
                          placeholder="Tell us about the content, platforms and timeline..."
                          rows={5}
                          maxLength={3000}
                        />
                      </div>

                      <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                          </>
                        ) : (
                          <>
                            <CalendarCheck className="w-4 h-4 mr-2" /> Submit & book call
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Business;
