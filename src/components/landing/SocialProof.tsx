import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Content Creator",
    avatar: "PS",
    rating: 5,
    text: "Zyrozo completely changed how I monetize my content. I sold my first preset pack within hours of listing. The platform is incredibly intuitive!",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    name: "Arjun Patel",
    role: "Video Editor",
    avatar: "AP",
    rating: 5,
    text: "As a buyer, I love the instant downloads. As a seller, I love the instant payouts. It's a win-win platform that actually works.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Sneha Reddy",
    role: "Digital Artist",
    avatar: "SR",
    rating: 5,
    text: "Finally, a marketplace that understands creators! The 10% fee is fair, and I've already made ₹50,000 in my first month.",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    name: "Vikram Singh",
    role: "Course Creator",
    avatar: "VS",
    rating: 5,
    text: "The campaign feature is brilliant. I joined a brand campaign and earned more in a week than I do in a month elsewhere.",
    gradient: "from-orange-500 to-amber-500",
  },
];

const stats = [
  { value: "50,000+", label: "Digital Products Sold" },
  { value: "₹2Cr+", label: "Paid to Creators" },
  { value: "10,000+", label: "Active Sellers" },
  { value: "4.9/5", label: "Average Rating" },
];

export const SocialProof = () => {
  return (
    <section className="py-20 md:py-28 relative bg-muted/30 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold gradient-text mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Loved by <span className="gradient-text">Creators</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of creators who trust Zyrozo for their digital business.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.name}
              className="relative bg-card border border-border rounded-2xl p-6 md:p-8 hover:border-primary/30 transition-all duration-300"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-muted-foreground/20" />

              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-semibold text-sm`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Brand Logos / Trust */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-6">Trusted by creators from</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {["YouTube", "Instagram", "TikTok", "Twitter", "LinkedIn"].map((platform) => (
              <span key={platform} className="font-display font-bold text-lg text-muted-foreground">
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
