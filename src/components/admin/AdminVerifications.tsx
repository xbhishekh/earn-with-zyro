import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, Send, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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

const AdminVerifications = () => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [adminCode, setAdminCode] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_link":
        return <Badge variant="outline" className="text-warning border-warning">Pending Link</Badge>;
      case "awaiting_code":
        return <Badge variant="outline" className="text-primary border-primary">Awaiting Code</Badge>;
      case "verified":
        return <Badge variant="outline" className="text-success border-success">Verified</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-destructive border-destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSendCode = async (account: SocialAccount) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const { error } = await supabase
        .from("social_accounts")
        .update({ 
          admin_code: code,
          status: "awaiting_code" 
        })
        .eq("id", account.id);

      if (error) throw error;
      toast.success(`Code sent: ${code}`);
      fetchAccounts();
    } catch (error) {
      toast.error("Failed to send code");
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
      toast.success("Account verified!");
      setSelectedAccount(null);
      setAdminNotes("");
      fetchAccounts();
    } catch (error) {
      toast.error("Failed to verify");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAccount) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("social_accounts")
        .update({ 
          status: "rejected",
          is_verified: false,
          admin_notes: adminNotes || null
        })
        .eq("id", selectedAccount.id);

      if (error) throw error;
      toast.success("Account rejected");
      setSelectedAccount(null);
      setAdminNotes("");
      fetchAccounts();
    } catch (error) {
      toast.error("Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAccounts = accounts.filter((a) =>
    (a.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    a.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Social Account Verifications</h1>
          <p className="text-muted-foreground">Verify creator social accounts</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAccounts}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="font-display text-2xl font-bold text-warning">
            {accounts.filter(a => a.status === "pending_link" || a.status === "awaiting_code").length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Verified</p>
          <p className="font-display text-2xl font-bold text-success">
            {accounts.filter(a => a.status === "verified").length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Rejected</p>
          <p className="font-display text-2xl font-bold text-destructive">
            {accounts.filter(a => a.status === "rejected").length}
          </p>
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Admin Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No accounts to verify
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.username || "-"}</TableCell>
                  <TableCell>{account.platform}</TableCell>
                  <TableCell>
                    {account.profile_url ? (
                      <a
                        href={account.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {account.admin_code ? (
                      <code className="bg-muted px-2 py-1 rounded text-xs">{account.admin_code}</code>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {account.status === "pending_link" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendCode(account)}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Send Code
                        </Button>
                      )}
                      {account.status === "awaiting_code" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAccount(account);
                            setAdminNotes("");
                          }}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Social Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Platform</p>
                <p className="font-medium">{selectedAccount?.platform}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{selectedAccount?.username || "-"}</p>
              </div>
            </div>
            {selectedAccount?.admin_code && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Admin Code (should be in their bio)</p>
                <code className="text-lg font-bold">{selectedAccount.admin_code}</code>
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Admin Notes</label>
              <Textarea
                placeholder="Optional notes..."
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
              className="bg-success hover:bg-success/90"
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
