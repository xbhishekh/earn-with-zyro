import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Heart, 
  Rocket, 
  Users, 
  Zap,
  ArrowRight,
  Globe,
  Coffee,
  Laptop,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";

const perks = [
  {
    icon: Laptop,
    title: "Remote First",
    description: "Work from anywhere in the world. We believe in flexibility.",
  },
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Comprehensive health insurance and mental wellness programs.",
  },
  {
    icon: Rocket,
    title: "Growth Budget",
    description: "Annual learning budget for courses, books, and conferences.",
  },
  {
    icon: Coffee,
    title: "Team Retreats",
    description: "Quarterly in-person meetups at amazing destinations.",
  },
  {
    icon: Gift,
    title: "Stock Options",
    description: "Ownership in the company you're building.",
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "We care about output, not hours logged.",
  },
];

const openPositions = [
  {
    title: "Senior Full Stack Developer",
    team: "Engineering",
    location: "Remote (USA)",
    type: "Full-time",
    description: "Build and scale our creator platform using React, Node.js, and PostgreSQL.",
  },
  {
    title: "Product Designer",
    team: "Design",
    location: "Remote (USA)",
    type: "Full-time",
    description: "Shape the future of creator monetization with intuitive, beautiful designs.",
  },
  {
    title: "Growth Marketing Manager",
    team: "Marketing",
    location: "Remote (USA)",
    type: "Full-time",
    description: "Drive user acquisition and retention strategies for our creator community.",
  },
  {
    title: "Creator Success Lead",
    team: "Operations",
    location: "Remote (USA)",
    type: "Full-time",
    description: "Help creators succeed by providing world-class support and guidance.",
  },
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Careers at Zyrozo - Join the Creator Economy"
        description="Join Zyrozo and help build the future of creator monetization. We're hiring engineers, designers, and marketing professionals. Remote-first, global team."
        keywords="Zyrozo careers, creator economy jobs, remote jobs, startup jobs, tech jobs"
        canonical="/careers"
      />
      <Navbar />
      
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge className="mb-4 gradient-bg text-white">We're Hiring!</Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Build the Future of{" "}
              <span className="gradient-text">Creator Economy</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join a passionate team on a mission to help millions of creators 
              turn their passion into sustainable income.
            </p>
            <Button variant="hero" size="xl" asChild>
              <a href="#positions">
                View Open Positions
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
          </motion.div>
        </section>

        {/* Why Join Us */}
        <section className="container mx-auto px-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Why <span className="gradient-text">Zyrozo</span>?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We're not just building a product—we're building a movement to empower creators.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {perks.map((perk, index) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:-translate-y-1 transition-all glass-card">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <perk.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2">{perk.title}</h3>
                    <p className="text-sm text-muted-foreground">{perk.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Culture Section */}
        <section className="container mx-auto px-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 md:p-12 max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="font-display text-3xl font-bold mb-4">Our Culture</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We're a small but mighty team of builders, creators, and dreamers. 
                  We move fast, ship often, and learn from our users every day.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Bias for action over endless meetings
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Fully remote, globally distributed
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" />
                    Creator-first mindset in everything
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card rounded-2xl p-6 text-center">
                  <div className="font-display text-3xl font-bold gradient-text">15+</div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                </div>
                <div className="glass-card rounded-2xl p-6 text-center">
                  <div className="font-display text-3xl font-bold gradient-text">5</div>
                  <p className="text-sm text-muted-foreground">Countries</p>
                </div>
                <div className="glass-card rounded-2xl p-6 text-center">
                  <div className="font-display text-3xl font-bold gradient-text">2022</div>
                  <p className="text-sm text-muted-foreground">Founded</p>
                </div>
                <div className="glass-card rounded-2xl p-6 text-center">
                  <div className="font-display text-3xl font-bold gradient-text">∞</div>
                  <p className="text-sm text-muted-foreground">Possibilities</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Open Positions */}
        <section id="positions" className="container mx-auto px-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Open <span className="gradient-text">Positions</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Find your next opportunity and join our growing team.
            </p>
          </motion.div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {openPositions.map((position, index) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:border-primary/50 transition-colors group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{position.team}</Badge>
                          <Badge variant="secondary">{position.type}</Badge>
                        </div>
                        <h3 className="font-display font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                          {position.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {position.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {position.location}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                        <a href={`mailto:careers@zyrozo.com?subject=${encodeURIComponent("Application: " + position.title)}&body=${encodeURIComponent("Hi Zyrozo team,\n\nI'd like to apply for the " + position.title + " position.\n\nMy background:\n\nResume / LinkedIn:\n\nThanks!")}`}>
                          Apply Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 md:p-12 text-center max-w-3xl mx-auto"
          >
            <Briefcase className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl font-bold mb-4">
              Don't See Your Role?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              We're always looking for exceptional talent. Send us your resume and 
              tell us how you can contribute to our mission.
            </p>
            <Button variant="hero" size="xl" asChild>
              <a href="mailto:careers@zyrozo.com">
                Send Your Resume
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;
