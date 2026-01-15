import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

// Placeholder component - will use social_accounts table when created
const AdminVerifications = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Placeholder data
  const placeholderData = [
    { id: "1", username: "creator1", platform: "YouTube", profile_url: "https://youtube.com/@creator1", status: "pending_link" },
    { id: "2", username: "creator2", platform: "Instagram", profile_url: "https://instagram.com/creator2", status: "awaiting_code" },
    { id: "3", username: "creator3", platform: "TikTok", profile_url: "https://tiktok.com/@creator3", status: "verified" },
  ];

  useEffect(() => {
    setAccounts(placeholderData);
    setLoading(false);
  }, []);

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

  const handleSendCode = (id: string) => {
    toast.success("Verification code sent!");
  };

  const handleVerify = (id: string) => {
    toast.success("Account verified!");
  };

  const handleReject = (id: string) => {
    toast.success("Account rejected");
  };

  const filteredAccounts = accounts.filter((a) =>
    a.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Social Account Verifications</h1>
        <p className="text-muted-foreground">Verify creator social accounts</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by username or platform..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl p-4 border-l-4 border-l-primary"
      >
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Social accounts table needs to be created. This is a placeholder UI.
          Once the table is created, you'll be able to:
        </p>
        <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside">
          <li>Send verification codes to creators</li>
          <li>Verify accounts when codes match</li>
          <li>Reject suspicious accounts</li>
        </ul>
      </motion.div>

      {/* Table */}
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No accounts to verify
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.username}</TableCell>
                  <TableCell>{account.platform}</TableCell>
                  <TableCell>
                    <a
                      href={account.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {account.status === "pending_link" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendCode(account.id)}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Send Code
                        </Button>
                      )}
                      {account.status === "awaiting_code" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-success border-success hover:bg-success/10"
                            onClick={() => handleVerify(account.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(account.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
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

export default AdminVerifications;
