import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Filter, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  platforms: string[] | null;
  reward_per_1k_views: number;
  budget_total: number | null;
  campaign_type: string | null;
  status: string | null;
}

const categories = ["All", "Gaming", "Fitness", "Technology", "Travel", "Food", "Fashion", "Sports", "Entertainment"];

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Active <span className="gradient-text">Campaigns</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Browse our active campaigns and start earning from your content today
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search campaigns..." className="pl-10 h-12 bg-card border-border" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <Button key={category} variant={category === selectedCategory ? "default" : "outline"} size="sm" className="whitespace-nowrap" onClick={() => setSelectedCategory(category)}>
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No campaigns found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign, index) => (
                <motion.div key={campaign.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.05 }}>
                  <Link to={`/campaigns/${campaign.id}`} className="block glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {campaign.thumbnail_url ? (
                        <img src={campaign.thumbnail_url} alt={campaign.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">{campaign.campaign_type?.toUpperCase() || "UGC"}</Badge>
                        <Badge variant="default" className="gradient-bg border-0">Active</Badge>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display font-bold text-lg mb-1 group-hover:text-primary transition-colors">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{campaign.description || "No description"}</p>
                      <div className="flex gap-2 mb-4">
                        {campaign.platforms?.slice(0, 3).map((platform) => (
                          <span key={platform} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">{platform}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="w-4 h-4 text-success" />
                          <span className="font-semibold">₹{campaign.reward_per_1k_views}</span>
                          <span className="text-muted-foreground">/1K views</span>
                        </div>
                        {campaign.category && <Badge variant="outline">{campaign.category}</Badge>}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Campaigns;
