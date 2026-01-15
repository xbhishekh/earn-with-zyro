import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Filter, TrendingUp, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";

// Demo campaigns data
const campaigns = [
  {
    id: "1",
    name: "ShadowPlay Gaming",
    description: "Create epic gaming clips and montages for ShadowPlay's new marketing campaign",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop",
    category: "Gaming",
    platforms: ["YouTube", "TikTok"],
    rewardPer1k: 25,
    totalBudget: 50000,
    members: 245,
    type: "UGC",
    status: "active",
  },
  {
    id: "2",
    name: "FitLife Supplements",
    description: "Share your fitness journey and feature FitLife products in your content",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    category: "Fitness",
    platforms: ["Instagram", "YouTube"],
    rewardPer1k: 30,
    totalBudget: 75000,
    members: 189,
    type: "UGC",
    status: "active",
  },
  {
    id: "3",
    name: "TechFlow Gadgets",
    description: "Unbox and review the latest tech gadgets from TechFlow's product line",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop",
    category: "Technology",
    platforms: ["YouTube", "Instagram"],
    rewardPer1k: 35,
    totalBudget: 100000,
    members: 312,
    type: "Clipping",
    status: "active",
  },
  {
    id: "4",
    name: "Wanderlust Travel",
    description: "Capture your travel adventures and inspire others to explore",
    thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop",
    category: "Travel",
    platforms: ["Instagram", "TikTok"],
    rewardPer1k: 28,
    totalBudget: 60000,
    members: 156,
    type: "UGC",
    status: "active",
  },
  {
    id: "5",
    name: "Foodie's Paradise",
    description: "Create mouth-watering food content featuring local restaurants",
    thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
    category: "Food",
    platforms: ["Instagram", "TikTok", "YouTube"],
    rewardPer1k: 22,
    totalBudget: 40000,
    members: 98,
    type: "UGC",
    status: "active",
  },
  {
    id: "6",
    name: "StyleBox Fashion",
    description: "Show off your unique style with StyleBox's latest collection",
    thumbnail: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop",
    category: "Fashion",
    platforms: ["Instagram", "TikTok"],
    rewardPer1k: 32,
    totalBudget: 85000,
    members: 267,
    type: "UGC",
    status: "active",
  },
];

const categories = ["All", "Gaming", "Fitness", "Technology", "Travel", "Food", "Fashion"];

const Campaigns = () => {
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
              Active <span className="gradient-text">Campaigns</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Browse our active campaigns and start earning from your content today
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 mb-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                className="pl-10 h-12 bg-card border-border"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
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
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </motion.div>

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link
                  to={`/campaigns/${campaign.id}`}
                  className="block glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={campaign.thumbnail}
                      alt={campaign.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                        {campaign.type}
                      </Badge>
                      <Badge variant="default" className="gradient-bg border-0">
                        Active
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {campaign.description}
                        </p>
                      </div>
                    </div>

                    {/* Platforms */}
                    <div className="flex gap-2 mb-4">
                      {campaign.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-4 h-4 text-success" />
                        <span className="font-semibold">₹{campaign.rewardPer1k}</span>
                        <span className="text-muted-foreground">/1K views</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{campaign.members} joined</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Campaigns
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Campaigns;
