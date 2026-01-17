import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mail, 
  MapPin, 
  MessageCircle, 
  Send, 
  Clock, 
  Phone,
  Loader2,
  CheckCircle,
  Twitter,
  Instagram,
  Youtube,
  Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "For general inquiries",
    value: "hello@zyrozo.com",
    action: "mailto:hello@zyrozo.com",
    color: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
  },
  {
    icon: Headphones,
    title: "Support",
    description: "For account & technical help",
    value: "support@zyrozo.com",
    action: "mailto:support@zyrozo.com",
    color: "from-green-500/20 to-green-600/20 border-green-500/30",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Quick response, 24/7",
    value: "Start a conversation",
    action: "/support",
    color: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
  },
];

const socialLinks = [
  { icon: Twitter, label: "Twitter", href: "https://twitter.com/zyrozo" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/zyrozo" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@zyrozo" },
];

const inquiryTypes = [
  "General Inquiry",
  "Partnership / Brand Deals",
  "Creator Support",
  "Press / Media",
  "Bug Report",
  "Feature Request",
  "Other",
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.type || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitting(false);
    setSubmitted(true);
    toast.success("Message sent successfully! We'll get back to you soon.");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Contact Us - Get in Touch with Zyrozo"
        description="Have questions about Zyrozo? Contact our team for support, partnerships, or general inquiries. We typically respond within 24-48 hours."
        keywords="contact Zyrozo, creator support, partnership inquiry, customer service"
        canonical="/contact"
      />
      <Navbar />
      
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Have a question, suggestion, or just want to say hello? 
              We'd love to hear from you.
            </p>
          </motion.div>
        </section>

        {/* Contact Methods */}
        <section className="container mx-auto px-4 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.title}
                href={method.action}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="block"
              >
                <Card className={`h-full hover:-translate-y-1 transition-all cursor-pointer border bg-gradient-to-br ${method.color}`}>
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-xl bg-background/80 flex items-center justify-center mx-auto mb-4">
                      <method.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-1">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                    <p className="text-sm font-medium text-primary">{method.value}</p>
                  </CardContent>
                </Card>
              </motion.a>
            ))}
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="container mx-auto px-4 mb-16">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card">
                <CardContent className="p-8">
                  {submitted ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-display text-2xl font-bold mb-2">Message Sent!</h3>
                      <p className="text-muted-foreground mb-6">
                        Thank you for reaching out. We'll get back to you within 24 hours.
                      </p>
                      <Button variant="outline" onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", email: "", type: "", subject: "", message: "" });
                      }}>
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-display text-2xl font-bold mb-6">Send us a Message</h2>
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Your Name *</Label>
                            <Input
                              id="name"
                              placeholder="John Doe"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="john@example.com"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Inquiry Type *</Label>
                          <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select inquiry type" />
                            </SelectTrigger>
                            <SelectContent>
                              {inquiryTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            placeholder="Brief summary of your message"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="message">Message *</Label>
                          <Textarea
                            id="message"
                            placeholder="Tell us more about your inquiry..."
                            rows={5}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          />
                        </div>

                        <Button 
                          type="submit" 
                          variant="hero" 
                          size="lg" 
                          className="w-full"
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              {/* Office Info */}
              <Card className="glass-card">
                <CardContent className="p-8">
                  <h3 className="font-display text-xl font-bold mb-6">Our Office</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">
                          Zyrozo Inc.<br />
                          123 Creator Lane, Suite 100<br />
                          San Francisco, CA 94105<br />
                          USA
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Business Hours</p>
                        <p className="text-sm text-muted-foreground">
                          Monday - Friday: 10:00 AM - 7:00 PM IST<br />
                          Saturday - Sunday: Closed
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Time */}
              <Card className="glass-card border-primary/20">
                <CardContent className="p-8">
                  <h3 className="font-display text-xl font-bold mb-4">Response Times</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">General Inquiries</span>
                      <span className="font-medium">24-48 hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Technical Support</span>
                      <span className="font-medium">Within 24 hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Live Chat</span>
                      <span className="font-medium text-success">Instant</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="glass-card">
                <CardContent className="p-8">
                  <h3 className="font-display text-xl font-bold mb-4">Follow Us</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Stay updated with the latest news and announcements.
                  </p>
                  <div className="flex items-center gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
                        aria-label={social.label}
                      >
                        <social.icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
