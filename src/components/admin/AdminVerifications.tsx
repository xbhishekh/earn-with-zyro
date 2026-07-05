import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, Send, ExternalLink, RefreshCw, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface SocialAccount {
  id: string;
  user_id: string;
  platform: string;
  username: string | null;
  profile_url: string | null;
  verification_code: string | null;
  admin_code: string | null;
  status: string;
  is_verified: boolean;
  admin_notes: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
}

const AdminVerifications = () => {
  const { user } = useAuth();
  const { hasFullAccess, myCampaignMemberUserIds, loading: accessLoading } = useAdminAccess();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [sendCodeAccount, setSendCodeAccount] = useState<SocialAccount | null>(null);
  const [codeToSend, setCodeToSend] = useState("");
  
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!accessLoading) fetchData();
  }, [accessLoading, hasFullAccess, myCampaignMemberUserIds]);

  const fetchData = async () => {
    try {
      let accountsQuery = supabase.from("social_accounts").select("*").order("created_at", { ascending: false });
      
      // Filter for normal admin
      if (!hasFullAccess && myCampaignMemberUserIds.length > 0) {
        accountsQuery = accountsQuery.in("user_id", myCampaignMemberUserIds);
      } else if (!hasFullAccess && myCampaignMemberUserIds.length === 0) {
        setAccounts([]);
        setProfiles([]);
        setLoading(false);
        return;
      }

      const [accountsRes, profilesRes] = await Promise.all([
        accountsQuery,
        supabase.from("profiles").select("user_id, username, display_name"),
      ]);

      if (accountsRes.error) throw accountsRes.error;
      setAccounts(accountsRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const getUsername = (userId: string): string => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.username || profile?.display_name || userId.slice(0, 8);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_link":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">Pending Link</Badge>;
      case "awaiting_code":
        return <Badge variant="outline" className="text-blue-500 border-blue-500/50">Awaiting User</Badge>;
      case "pending_verification":
        return <Badge variant="outline" className="text-purple-500 border-purple-500/50">Ready to Verify</Badge>;
      case "verified":
        return <Badge variant="outline" className="text-green-500 border-green-500/50">Verified</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-destructive border-destructive/50">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const generateCode = (): string => {
    return `CLIPERUS_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const handleSendCode = async () => {
    if (!sendCodeAccount || !codeToSend.trim()) {
      toast.error("Please enter a code");
      return;
    }
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("social_accounts")
        .update({ 
          admin_code: codeToSend.trim(),
          status: "awaiting_code" 
        })
        .eq("id", sendCodeAccount.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: sendCodeAccount.user_id,
        type: "verification_code",
        title: "Verification Code Ready!",
        message: `Your ${sendCodeAccount.platform} verification code is ready. Add it to your bio.`,
      });

      toast.success("Code sent to user!");
      setSendCodeAccount(null);
      setCodeToSend("");
      fetchData();
    } catch (error) {
      toast.error("Failed to send code");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedAccount) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("social_accounts")
        .update({ 
          status: "verified",
          is_verified: true,
          admin_notes: adminNotes || null,
          verified_at: new Date().toISOString()
        })
        .eq("id", selectedAccount.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: selectedAccount.user_id,
        type: "account_verified",
        title: "Account Verified! ✅",
        message: `Your ${selectedAccount.platform} account (@${selectedAccount.username}) has been verified.`,
      });

      toast.success("Account verified!");
      setSelectedAccount(null);
      setAdminNotes("");
      fetchData();
    } catch (error) {
      toast.error("Failed to verify");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAccount || !adminNotes.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("social_accounts")
        .update({ 
          status: "rejected",
          is_verified: false,
          admin_notes: adminNotes
        })
        .eq("id", selectedAccount.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: selectedAccount.user_id,
        type: "account_rejected",
        title: "Verification Rejected",
        message: `Your ${selectedAccount.platform} verification was rejected: ${adminNotes}`,
      });

      toast.success("Account rejected");
      setSelectedAccount(null);
      setAdminNotes("");
      fetchData();
    } catch (error) {
      toast.error("Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingLinkAccounts = accounts.filter(a => a.status === "pending_link");
  const awaitingCodeAccounts = accounts.filter(a => a.status === "awaiting_code");
  const pendingVerificationAccounts = accounts.filter(a => a.status === "pending_verification");
  const verifiedAccounts = accounts.filter(a => a.status === "verified");
  const rejectedAccounts = accounts.filter(a => a.status === "rejected");

  const filterBySearch = (list: SocialAccount[]) => {
    if (!searchTerm) return list;
    return list.filter(a =>
      (a.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      a.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUsername(a.user_id).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasFullAccess && myCampaignMemberUserIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-bold mb-2">No Campaign Members</h3>
        <p className="text-muted-foreground">Create a campaign and get members to verify their social accounts here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Social Account Verifications</h1>
          <p className="text-muted-foreground">
            {hasFullAccess ? "Verify all creator social accounts" : "Verify social accounts for your campaign members"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-yellow-500">Pending Link</p>
          <p className="font-display text-2xl font-bold">{pendingLinkAccounts.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-blue-500">Awaiting User</p>
          <p className="font-display text-2xl font-bold">{awaitingCodeAccounts.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-purple-500">Ready to Verify</p>
          <p className="font-display text-2xl font-bold">{pendingVerificationAccounts.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-green-500">Verified</p>
          <p className="font-display text-2xl font-bold">{verifiedAccounts.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-destructive">Rejected</p>
          <p className="font-display text-2xl font-bold">{rejectedAccounts.length}</p>
        </motion.div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by username or platform..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="pending_link" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="pending_link" className="relative">
            Pending Link
            {pendingLinkAccounts.length > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingLinkAccounts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="awaiting_code">
            Awaiting User
            {awaitingCodeAccounts.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {awaitingCodeAccounts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending_verification">
            Ready to Verify
            {pendingVerificationAccounts.length > 0 && (
              <span className="ml-2 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingVerificationAccounts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending_link">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterBySearch(pendingLinkAccounts).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No pending link requests
                    </TableCell>
                  </TableRow>
                ) : (
                  filterBySearch(pendingLinkAccounts).map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">@{getUsername(account.user_id)}</TableCell>
                      <TableCell className="capitalize">{account.platform}</TableCell>
                      <TableCell>@{account.username}</TableCell>
                      <TableCell>
                        {account.profile_url ? (
                          <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(account.created_at), "dd MMM")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSendCodeAccount(account);
                            setCodeToSend(generateCode());
                          }}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Send Code
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>

        <TabsContent value="awaiting_code">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Code Sent</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterBySearch(awaitingCodeAccounts).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users awaiting code confirmation
                    </TableCell>
                  </TableRow>
                ) : (
                  filterBySearch(awaitingCodeAccounts).map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">@{getUsername(account.user_id)}</TableCell>
                      <TableCell className="capitalize">{account.platform}</TableCell>
                      <TableCell>@{account.username}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-xs">{account.admin_code}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-blue-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Waiting for user to add code to bio</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>

        <TabsContent value="pending_verification">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterBySearch(pendingVerificationAccounts).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No accounts ready for verification
                    </TableCell>
                  </TableRow>
                ) : (
                  filterBySearch(pendingVerificationAccounts).map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">@{getUsername(account.user_id)}</TableCell>
                      <TableCell className="capitalize">{account.platform}</TableCell>
                      <TableCell>@{account.username}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-xs">{account.admin_code}</code>
                      </TableCell>
                      <TableCell>
                        {account.profile_url ? (
                          <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setAdminNotes("");
                          }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Send Code Modal */}
      <Dialog open={!!sendCodeAccount} onOpenChange={() => setSendCodeAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Verification Code</DialogTitle>
            <DialogDescription>
              Send this code to the user to add to their {sendCodeAccount?.platform} bio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">User</p>
              <p className="font-medium">@{getUsername(sendCodeAccount?.user_id || "")}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Platform Username</p>
              <p className="font-medium">@{sendCodeAccount?.username}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Verification Code</label>
              <Input 
                value={codeToSend}
                onChange={(e) => setCodeToSend(e.target.value)}
                className="font-mono"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2"
                onClick={() => setCodeToSend(generateCode())}
              >
                Generate New Code
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendCodeAccount(null)}>Cancel</Button>
            <Button onClick={handleSendCode} disabled={actionLoading}>
              <Send className="w-4 h-4 mr-2" />
              Send Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Account</DialogTitle>
            <DialogDescription>
              Check that the code is in the user's {selectedAccount?.platform} bio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Platform</p>
                <p className="font-medium capitalize">{selectedAccount?.platform}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Username</p>
                <p className="font-medium">@{selectedAccount?.username}</p>
              </div>
            </div>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Code to find in bio</p>
              <code className="font-mono text-lg">{selectedAccount?.admin_code}</code>
            </div>
            {selectedAccount?.profile_url && (
              <a 
                href={selectedAccount.profile_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Open Profile to Verify
              </a>
            )}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Admin Notes (required for rejection)</label>
              <Textarea 
                placeholder="Enter notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              className="text-destructive"
              onClick={handleReject}
              disabled={actionLoading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600"
              onClick={handleVerify}
              disabled={actionLoading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerifications;
