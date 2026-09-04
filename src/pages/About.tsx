import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Target, Users, Zap, Globe, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO, organizationSchema } from "@/components/SEO";
const values = [
  {
    icon: Target,
    title: "Creator First",
    description: "Everything we build is designed to help creators succeed and earn more.",
  },
  {
    icon: Heart,
    title: "Fair Rewards",
    description: "We believe creators deserve fair compensation for their work and creativity.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Our community of creators helps shape the platform and its features.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Connect with brands from around the world and grow your audience.",
  },
];

const stats = [
  { value: "$50K+", label: "Paid to Creators" },
  { value: "5,000+", label: "Active Creators" },
  { value: "100+", label: "Brand Partners" },
  { value: "10M+", label: "Total Views" },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About CliporaX - Empowering Creators to Earn More"
        description="Learn about CliporaX's mission to democratize creator monetization. We've paid $50K+ to 5,000+ creators. Discover our values, story, and how we help creators succeed."
        keywords="about CliporaX, creator platform, content creator earnings, UGC monetization, creator economy"
        canonical="/about"
        structuredData={organizationSchema}
      />
      <Navbar />
      
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Empowering Creators to{" "}
              <span className="gradient-text">Earn More</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              CliporaX is a leading creator rewards platform, connecting talented 
              content creators with top brands for mutually rewarding partnerships.
            </p>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="container mx-auto px-4 mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 text-center"
              >
                <div className="font-display text-3xl md:text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="container mx-auto px-4 mb-24">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-8 md:p-12"
            >
              <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We're on a mission to democratize creator monetization. Too many talented 
                creators struggle to turn their passion into sustainable income. CliporaX 
                bridges the gap between brands looking for authentic content and creators 
                ready to deliver it. Our platform ensures fair compensation, transparent 
                tracking, and instant payments—so creators can focus on what they do best: creating.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="container mx-auto px-4 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Our <span className="gradient-text">Values</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 text-center group hover:-translate-y-1 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
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
            <Award className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Join Our Community?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Start your creator journey today and join thousands of creators 
              already earning with CliporaX.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">Create Free Account</Link>
            </Button>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
