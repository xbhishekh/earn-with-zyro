import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Link2, Users, DollarSign, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { toast } from "sonner";
import { format } from "date-fns";

interface AffiliateLink {
  id: string;
  user_id: string;
  campaign_id: string | null;
  code: string;
  clicks: number;
  signups: number;
  conversions: number;
  created_at: string;
}

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
}

const AdminAffiliates = () => {
  const { hasFullAccess, myCampaignIds, loading: accessLoading } = useAdminAccess();
  const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!accessLoading) fetchData();
  }, [accessLoading, hasFullAccess, myCampaignIds]);

  const fetchData = async () => {
    try {
      let affiliatesQuery = supabase.from("affiliate_links").select("*").order("created_at", { ascending: false });
      
      // Filter for normal admin
      if (!hasFullAccess && myCampaignIds.length > 0) {
        affiliatesQuery = affiliatesQuery.in("campaign_id", myCampaignIds);
      } else if (!hasFullAccess && myCampaignIds.length === 0) {
        setAffiliates([]);
        setProfiles([]);
        setLoading(false);
        return;
      }

      const [affiliatesRes, profilesRes] = await Promise.all([
        affiliatesQuery,
        supabase.from("profiles").select("user_id, username, display_name"),
      ]);

      if (affiliatesRes.error) throw affiliatesRes.error;
      setAffiliates(affiliatesRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load affiliates");
    } finally {
      setLoading(false);
    }
  };

  const getUsername = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.username || profile?.display_name || userId.slice(0, 8);
  };

  const totalClicks = affiliates.reduce((a, b) => a + (b.clicks || 0), 0);
  const totalSignups = affiliates.reduce((a, b) => a + (b.signups || 0), 0);
  const totalConversions = affiliates.reduce((a, b) => a + (b.conversions || 0), 0);

  const filteredAffiliates = affiliates.filter(a => 
    a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getUsername(a.user_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty state for normal admin
  if (!hasFullAccess && myCampaignIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Link2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Campaigns Yet</h2>
        <p className="text-muted-foreground max-w-md">
          Create your first campaign to view affiliate links.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Affiliate Management</h1>
          <p className="text-muted-foreground">
            {hasFullAccess ? "View all affiliate links and stats" : "View affiliate links for your campaigns"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Links</p>
              <p className="font-display text-xl font-bold">{affiliates.length}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="font-display text-xl font-bold">{totalClicks.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Signups</p>
              <p className="font-display text-xl font-bold">{totalSignups.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="font-display text-xl font-bold">{totalConversions.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search affiliates..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-10" 
        />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Signups</TableHead>
              <TableHead>Conversions</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAffiliates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No affiliate links found
                </TableCell>
              </TableRow>
            ) : (
              filteredAffiliates.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">@{getUsername(a.user_id)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.code}</Badge>
                  </TableCell>
                  <TableCell>{a.clicks?.toLocaleString() || 0}</TableCell>
                  <TableCell>{a.signups?.toLocaleString() || 0}</TableCell>
                  <TableCell>{a.conversions?.toLocaleString() || 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(a.created_at), "dd MMM yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
};

export default AdminAffiliates;
