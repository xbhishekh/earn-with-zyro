import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  MessageCircle,
  Loader2,
  Users,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { format } from "date-fns";
import PayUserModal from "@/components/profile/PayUserModal";

interface UserProfileData {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  is_verified: boolean;
  show_total_earned: boolean;
  show_location: boolean;
  show_owned_products: boolean;
  show_joined_products: boolean;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  slug: string | null;
  thumbnail_url: string | null;
  price: number;
  product_type: string;
  members_count: number;
  views_count: number;
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);

  const isOwnProfile = user?.id === profile?.user_id;

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  useEffect(() => {
    if (user) {
      fetchAvailableBalance();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        navigate("/404");
        return;
      }

      setProfile(data as UserProfileData);

      // Fetch user's products if they have show_owned_products enabled
      if (data.show_owned_products) {
        const { data: productsData } = await supabase
          .from("marketplace_products")
          .select("id, title, slug, thumbnail_url, price, product_type, members_count, views_count")
          .eq("seller_id", data.user_id)
          .eq("is_active", true)
          .limit(6);

        setProducts(productsData || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBalance = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("balance_transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "completed");

      const total = (data || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);
      setAvailableBalance(Math.max(0, total));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const handleMessage = async () => {
    if (!user || !profile) return;
    
    // Create or find DM room and navigate to messages
    navigate(`/messages?user=${profile.user_id}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">User not found</h1>
            <p className="text-muted-foreground mb-4">This profile doesn't exist</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {profile.display_name?.charAt(0)?.toUpperCase() || profile.username?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-xl font-bold">
                  {profile.display_name || profile.username || "User"}
                </h1>
                {profile.is_verified && (
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                )}
              </div>
              <p className="text-muted-foreground">@{profile.username || "user"}</p>

              {profile.bio && (
                <p className="mt-3 text-sm">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {profile.show_location && profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {format(new Date(profile.created_at), "MMM yyyy")}
                </div>
              </div>
            </div>

            {/* Pay Button - Only show for other users */}
            {!isOwnProfile && user && (
              <Button
                onClick={() => setShowPayModal(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Pay
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && user && (
            <div className="flex gap-3 mt-6">
              <Button onClick={handleMessage} className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <div className="mt-6">
              <Button asChild variant="outline" className="w-full">
                <Link to="/profile">Edit Profile</Link>
              </Button>
            </div>
          )}
        </motion.div>

        {/* Products Section */}
        {profile.show_owned_products && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/marketplace/${product.slug || product.id}`}
                  className="bg-muted/50 rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
                >
                  {product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url}
                      alt={product.title}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-medium truncate">{product.title}</h3>
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {product.members_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {product.views_count}
                        </span>
                      </div>
                      <span className="font-medium text-primary">
                        {product.price === 0 ? "Free" : `$${product.price}`}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Pay Modal */}
      {profile && (
        <PayUserModal
          open={showPayModal}
          onOpenChange={setShowPayModal}
          currentUserId={user?.id || ""}
          availableBalance={availableBalance}
          onSuccess={fetchAvailableBalance}
          preselectedUser={{
            id: profile.id,
            user_id: profile.user_id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          }}
        />
      )}
    </MainLayout>
  );
};

export default UserProfile;
