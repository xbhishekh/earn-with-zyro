import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, Ban, Users, Shield, Eye, Globe, Target, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface Campaign {
  id: string;
  name: string;
}

interface Suspension {
  id: string;
  campaign_id: string | null;
  reason: string | null;
  is_active: boolean;
  suspended_at: string;
  campaigns?: { name: string } | null;
}

const AdminUsers = () => {
  const { user } = useAuth();
  const { hasFullAccess, myCampaignIds, myCampaignMemberUserIds, loading: accessLoading } = useAdminAccess();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banType, setBanType] = useState<"global" | "campaign">("global");
  const [banReason, setBanReason] = useState("");
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [userSuspensions, setUserSuspensions] = useState<Suspension[]>([]);
  const [suspensionSummaryByUserId, setSuspensionSummaryByUserId] = useState<Record<string, { globalId?: string; campaignCount: number }>>({});
  const [viewBansUser, setViewBansUser] = useState<any>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => { 
    if (!accessLoading) {
      fetchProfiles(); 
      fetchCampaigns(); 
    }
  }, [page, accessLoading, hasFullAccess, myCampaignMemberUserIds]);

  const fetchSuspensionSummary = async (userIds: string[]) => {
    try {
      if (userIds.length === 0) {
        setSuspensionSummaryByUserId({});
        return;
      }

      const { data, error } = await supabase
        .from("user_suspensions")
        .select("id, user_id, campaign_id")
        .in("user_id", userIds)
        .eq("is_active", true);

      if (error) throw error;

      const next: Record<string, { globalId?: string; campaignCount: number }> = {};
      for (const row of data || []) {
        const existing = next[row.user_id] || { campaignCount: 0 };
        if (!row.campaign_id) {
          existing.globalId = row.id;
        } else {
          existing.campaignCount += 1;
        }
        next[row.user_id] = existing;
      }

      setSuspensionSummaryByUserId(next);
    } catch (error) {
      console.error("Error fetching suspension summary:", error);
      setSuspensionSummaryByUserId({});
    }
  };

  const fetchProfiles = async () => {
    try {
      let nextProfiles: any[] = [];

      if (hasFullAccess) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        nextProfiles = data || [];
      } else {
        // Normal admin: Only users who joined my campaigns
        if (myCampaignMemberUserIds.length > 0) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .in("user_id", myCampaignMemberUserIds)
            .order("created_at", { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);
          nextProfiles = data || [];
        } else {
          nextProfiles = [];
        }
      }

      setProfiles(nextProfiles);
      await fetchSuspensionSummary(nextProfiles.map((p) => p.user_id).filter(Boolean));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    if (hasFullAccess) {
      const { data } = await supabase.from("campaigns").select("id, name").order("name");
      setCampaigns(data || []);
    } else {
      // Normal admin: Only my campaigns
      if (myCampaignIds.length > 0) {
        const { data } = await supabase
          .from("campaigns")
          .select("id, name")
          .in("id", myCampaignIds)
          .order("name");
        setCampaigns(data || []);
      } else {
        setCampaigns([]);
      }
    }
  };

  const fetchUserSuspensions = async (userId: string) => {
    const { data } = await supabase
      .from("user_suspensions")
      .select("*, campaigns(name)")
      .eq("user_id", userId)
      .eq("is_active", true);
    setUserSuspensions(data || []);
  };

  const handleVerify = async (userId: string, currentVerified: boolean) => {
    try {
      await supabase.from("profiles").update({ is_verified: !currentVerified }).eq("user_id", userId);
      toast.success(currentVerified ? "Verification removed" : "User verified!");
      fetchProfiles();
    } catch { toast.error("Failed to update verification"); }
  };

  const openBanModal = (profile: any) => {
    setSelectedUser(profile);
    setBanType(hasFullAccess ? "global" : "campaign");
    setBanReason("");
    setSelectedCampaigns([]);
  };

  const openViewBansModal = async (profile: any) => {
    setViewBansUser(profile);
    await fetchUserSuspensions(profile.user_id);
  };

  const handleBan = async () => {
    if (!selectedUser || !user) return;
    if (!banReason.trim()) {
      toast.error("Please provide a reason for the ban");
      return;
    }

    try {
      if (banType === "global" && hasFullAccess) {
        const { error } = await supabase.from("user_suspensions").insert({
          user_id: selectedUser.user_id,
          campaign_id: null,
          reason: banReason,
          suspended_by: user.id,
          is_active: true
        });
        if (error) throw error;
        toast.success(`${selectedUser.display_name || selectedUser.username} has been globally suspended`);
      } else {
        if (selectedCampaigns.length === 0) {
          toast.error("Please select at least one campaign");
          return;
        }
        const inserts = selectedCampaigns.map(campaignId => ({
          user_id: selectedUser.user_id,
          campaign_id: campaignId,
          reason: banReason,
          suspended_by: user.id,
          is_active: true
        }));
        const { error } = await supabase.from("user_suspensions").insert(inserts);
        if (error) throw error;
        toast.success(`${selectedUser.display_name || selectedUser.username} has been banned from ${selectedCampaigns.length} campaign(s)`);
      }
      setSelectedUser(null);
      setBanReason("");
      setSelectedCampaigns([]);
    } catch (error) {
      console.error("Ban error:", error);
      toast.error("Failed to apply ban");
    }
  };

  const handleLiftBan = async (suspensionId: string) => {
    try {
      const { error } = await supabase
        .from("user_suspensions")
        .update({ is_active: false })
        .eq("id", suspensionId);
      if (error) throw error;
      toast.success("Ban lifted successfully");
      if (viewBansUser) {
        await fetchUserSuspensions(viewBansUser.user_id);
      }
    } catch (error) {
      console.error("Lift ban error:", error);
      toast.error("Failed to lift ban");
    }
  };

  const toggleCampaignSelection = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const filteredProfiles = profiles.filter(p => p.username?.toLowerCase().includes(searchTerm.toLowerCase()) || p.display_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading || accessLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  // Empty state for normal admin with no campaigns
  if (!hasFullAccess && myCampaignIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Campaigns Yet</h2>
        <p className="text-muted-foreground max-w-md">
          Create your first campaign to start managing users. You can only see users who have joined your campaigns.
        </p>
      </div>
    );
  }

  // Empty state for normal admin with campaigns but no members
  if (!hasFullAccess && myCampaignMemberUserIds.length === 0 && myCampaignIds.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Members Yet</h2>
        <p className="text-muted-foreground max-w-md">
          No users have joined your campaigns yet. Once users join, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">User Management</h1>
        <p className="text-muted-foreground">
          {hasFullAccess 
            ? "Manage platform users, verify accounts, and handle suspensions"
            : "Manage users who have joined your campaigns"
          }
        </p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 inline-block">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {hasFullAccess ? "Total Users" : "My Campaign Members"}
            </p>
            <p className="font-display text-xl font-bold">{profiles.length}+</p>
          </div>
        </div>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((p) => {
              const summary = suspensionSummaryByUserId[p.user_id];
              const isGloballySuspended = !!summary?.globalId;
              const campaignBanCount = summary?.campaignCount || 0;

              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{p.display_name || "No name"}</span>
                      {isGloballySuspended && <Badge variant="destructive">Suspended</Badge>}
                      {campaignBanCount > 0 && <Badge variant="secondary">Banned</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">@{p.username || "unknown"}</TableCell>
                  <TableCell>{p.is_verified ? <CheckCircle className="w-5 h-5 text-success" /> : "-"}</TableCell>
                  <TableCell>{format(new Date(p.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {hasFullAccess && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVerify(p.user_id, p.is_verified)}
                          title={p.is_verified ? "Remove verification" : "Verify user"}
                        >
                          {p.is_verified ? <Shield className="w-4 h-4 text-success" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                      )}

                      {/* Unsuspend */}
                      {(isGloballySuspended || campaignBanCount > 0) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // If it's only a global suspension and we have full access, allow one-click unsuspend.
                            if (hasFullAccess && isGloballySuspended && campaignBanCount === 0) {
                              handleLiftBan(summary!.globalId!);
                              return;
                            }
                            // Otherwise open bans modal so you can choose what to lift.
                            openViewBansModal(p);
                          }}
                          title={
                            hasFullAccess && isGloballySuspended && campaignBanCount === 0
                              ? "Unsuspend user"
                              : "View bans / Unsuspend"
                          }
                        >
                          <Unlock className="w-4 h-4" />
                        </Button>
                      )}

                      <Button size="sm" variant="ghost" onClick={() => openViewBansModal(p)} title="View bans / Unsuspend">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => openBanModal(p)} title="Ban user">
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </motion.div>

      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Previous</Button>
        <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page + 1}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={profiles.length < pageSize}>Next</Button>
      </div>

      {/* Ban User Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-destructive" />
              Ban User
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.display_name} (@{selectedUser?.username})
            </DialogDescription>
          </DialogHeader>
          
          {hasFullAccess ? (
            <Tabs value={banType} onValueChange={(v) => setBanType(v as "global" | "campaign")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="global" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Global Ban
                </TabsTrigger>
                <TabsTrigger value="campaign" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Campaign Ban
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="global" className="space-y-4 mt-4">
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">⚠️ Global Suspension</p>
                  <p className="text-xs text-muted-foreground mt-1">User will be blocked from accessing the entire platform.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="campaign" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Campaigns to Ban From</label>
                  <ScrollArea className="h-[200px] border rounded-lg p-2">
                    {campaigns.map(campaign => (
                      <div key={campaign.id} className="flex items-center space-x-2 py-2 px-1 hover:bg-muted/50 rounded">
                        <Checkbox 
                          id={campaign.id}
                          checked={selectedCampaigns.includes(campaign.id)}
                          onCheckedChange={() => toggleCampaignSelection(campaign.id)}
                        />
                        <label htmlFor={campaign.id} className="text-sm cursor-pointer flex-1">{campaign.name}</label>
                      </div>
                    ))}
                  </ScrollArea>
                  {selectedCampaigns.length > 0 && (
                    <p className="text-xs text-muted-foreground">{selectedCampaigns.length} campaign(s) selected</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Campaigns to Ban From</label>
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="flex items-center space-x-2 py-2 px-1 hover:bg-muted/50 rounded">
                    <Checkbox 
                      id={campaign.id}
                      checked={selectedCampaigns.includes(campaign.id)}
                      onCheckedChange={() => toggleCampaignSelection(campaign.id)}
                    />
                    <label htmlFor={campaign.id} className="text-sm cursor-pointer flex-1">{campaign.name}</label>
                  </div>
                ))}
              </ScrollArea>
              {selectedCampaigns.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedCampaigns.length} campaign(s) selected</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Ban *</label>
            <Textarea 
              placeholder="Explain why this user is being banned..." 
              value={banReason} 
              onChange={(e) => setBanReason(e.target.value)} 
              rows={3} 
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleBan} 
              disabled={!banReason.trim() || (!hasFullAccess && selectedCampaigns.length === 0) || (hasFullAccess && banType === "campaign" && selectedCampaigns.length === 0)}
            >
              <Ban className="w-4 h-4 mr-2" />
              {hasFullAccess && banType === "global" ? "Global Ban" : `Ban from ${selectedCampaigns.length} Campaign(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Bans Modal */}
      <Dialog open={!!viewBansUser} onOpenChange={() => setViewBansUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Active Bans
            </DialogTitle>
            <DialogDescription>
              {viewBansUser?.display_name} (@{viewBansUser?.username})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {userSuspensions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
                <p className="text-muted-foreground">No active bans for this user</p>
              </div>
            ) : (
              userSuspensions.map(suspension => (
                <div key={suspension.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {suspension.campaign_id ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {suspension.campaigns?.name || "Campaign"}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          Global Ban
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{suspension.reason || "No reason provided"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(suspension.suspended_at), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                  {(hasFullAccess || (suspension.campaign_id && myCampaignIds.includes(suspension.campaign_id))) && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleLiftBan(suspension.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Unsuspend
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewBansUser(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
