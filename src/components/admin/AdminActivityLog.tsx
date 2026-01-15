import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Activity, Filter, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action_type: string;
  target_type: string;
  target_id: string;
  action_details: string;
  created_at: string;
}

// Placeholder component - admin_activity_logs table needs to be created
const AdminActivityLog = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  // Placeholder data
  const placeholderLogs: ActivityLog[] = [
    {
      id: "1",
      admin_id: "admin1",
      admin_name: "Super Admin",
      action_type: "submission_approved",
      target_type: "submission",
      target_id: "sub123",
      action_details: "Approved submission with 50,000 views",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      admin_id: "admin1",
      admin_name: "Super Admin",
      action_type: "campaign_created",
      target_type: "campaign",
      target_id: "camp456",
      action_details: "Created new campaign: Gaming Challenge 2024",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "3",
      admin_id: "admin2",
      admin_name: "Admin User",
      action_type: "user_banned",
      target_type: "user",
      target_id: "user789",
      action_details: "Banned user for policy violation",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "4",
      admin_id: "admin1",
      admin_name: "Super Admin",
      action_type: "withdrawal_approved",
      target_type: "withdrawal",
      target_id: "wd101",
      action_details: "Approved withdrawal of ₹5,000",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  useEffect(() => {
    setLogs(placeholderLogs);
    setLoading(false);
  }, []);

  const getActionBadge = (actionType: string) => {
    if (actionType.includes("approved")) {
      return <Badge variant="outline" className="text-success border-success">Approved</Badge>;
    }
    if (actionType.includes("rejected") || actionType.includes("banned")) {
      return <Badge variant="outline" className="text-destructive border-destructive">Rejected/Banned</Badge>;
    }
    if (actionType.includes("created")) {
      return <Badge variant="outline" className="text-primary border-primary">Created</Badge>;
    }
    if (actionType.includes("updated")) {
      return <Badge variant="outline" className="text-warning border-warning">Updated</Badge>;
    }
    return <Badge variant="outline">{actionType.replace("_", " ")}</Badge>;
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = actionFilter === "all" || log.action_type.includes(actionFilter);
    return matchesSearch && matchesFilter;
  });

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
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-display text-2xl font-bold">Activity Log</h1>
          <Shield className="w-5 h-5 text-destructive" />
        </div>
        <p className="text-muted-foreground">Monitor all admin actions on the platform (Owner only)</p>
      </div>

      {/* Warning Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl p-4 border-l-4 border-l-destructive"
      >
        <p className="text-sm text-muted-foreground">
          <strong>🔒 Owner Access Only:</strong> This page shows all admin actions. Only platform owners can view this data.
          All actions are logged for security and accountability.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by admin or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="approved">Approvals</SelectItem>
            <SelectItem value="rejected">Rejections</SelectItem>
            <SelectItem value="created">Creations</SelectItem>
            <SelectItem value="updated">Updates</SelectItem>
            <SelectItem value="banned">Bans</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl p-12 text-center"
          >
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">No activity found</h3>
            <p className="text-muted-foreground">Adjust your filters to see more results</p>
          </motion.div>
        ) : (
          filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-xl p-4 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{log.admin_name}</span>
                  {getActionBadge(log.action_type)}
                </div>
                <p className="text-muted-foreground">{log.action_details}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(log.created_at), "dd MMM yyyy, HH:mm")}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {log.target_type}
              </Badge>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminActivityLog;
