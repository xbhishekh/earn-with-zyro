import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Play, Users, Star, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";

// Demo courses data
const courses = [
  {
    id: "1",
    title: "YouTube Growth Masterclass",
    description: "Learn the secrets to growing your YouTube channel from 0 to 100K subscribers",
    thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=300&fit=crop",
    creator: "Raj Sharma",
    price: 2999,
    originalPrice: 4999,
    rating: 4.8,
    reviews: 234,
    students: 1250,
    lessons: 45,
    duration: "8 hours",
    category: "YouTube",
    isFeatured: true,
  },
  {
    id: "2",
    title: "Instagram Reels Mastery",
    description: "Create viral reels that get millions of views and grow your following",
    thumbnail: "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400&h=300&fit=crop",
    creator: "Priya Kapoor",
    price: 1999,
    originalPrice: 3499,
    rating: 4.9,
    reviews: 189,
    students: 890,
    lessons: 32,
    duration: "5 hours",
    category: "Instagram",
    isFeatured: true,
  },
  {
    id: "3",
    title: "TikTok Content Strategy",
    description: "Master the TikTok algorithm and create content that goes viral",
    thumbnail: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=300&fit=crop",
    creator: "Amit Verma",
    price: 1499,
    originalPrice: 2499,
    rating: 4.7,
    reviews: 156,
    students: 720,
    lessons: 28,
    duration: "4 hours",
    category: "TikTok",
    isFeatured: false,
  },
  {
    id: "4",
    title: "Video Editing with Premiere Pro",
    description: "Professional video editing techniques used by top YouTubers",
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop",
    creator: "Vikram Singh",
    price: 3499,
    originalPrice: 5999,
    rating: 4.9,
    reviews: 312,
    students: 1800,
    lessons: 60,
    duration: "12 hours",
    category: "Editing",
    isFeatured: true,
  },
  {
    id: "5",
    title: "Brand Deals & Sponsorships",
    description: "How to pitch brands and negotiate sponsorship deals like a pro",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
    creator: "Neha Gupta",
    price: 2499,
    originalPrice: 3999,
    rating: 4.6,
    reviews: 98,
    students: 450,
    lessons: 20,
    duration: "3 hours",
    category: "Business",
    isFeatured: false,
  },
  {
    id: "6",
    title: "Monetization Masterclass",
    description: "Multiple income streams for content creators: ads, merch, courses & more",
    thumbnail: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop",
    creator: "Arjun Mehta",
    price: 3999,
    originalPrice: 6999,
    rating: 4.8,
    reviews: 267,
    students: 1100,
    lessons: 50,
    duration: "10 hours",
    category: "Business",
    isFeatured: true,
  },
];

const categories = ["All", "YouTube", "Instagram", "TikTok", "Editing", "Business"];

const Marketplace = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Creator <span className="gradient-text">Marketplace</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Learn from successful creators and level up your content game
            </p>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 overflow-x-auto pb-4 mb-8 justify-center"
          >
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </motion.div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link
                  to={`/course/${course.id}`}
                  className="block glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {course.isFeatured && (
                      <Badge className="absolute top-3 left-3 gradient-bg border-0">
                        Featured
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                        {course.category}
                      </span>
                    </div>
                    
                    <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {course.description}
                    </p>

                    <p className="text-sm text-muted-foreground mb-4">
                      by {course.creator}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {course.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.students}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <span className="font-display text-xl font-bold">₹{course.price}</span>
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{course.originalPrice}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-success/20 text-success font-semibold">
                        {Math.round((1 - course.price / course.originalPrice) * 100)}% OFF
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Courses
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;
