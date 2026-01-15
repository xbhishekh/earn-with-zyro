import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Activity, Filter, Shield, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  action_details: any;
  created_at: string;
}

const AdminActivityLog = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (actionType: string) => {
    if (actionType.includes("approved") || actionType.includes("verify")) {
      return <Badge variant="outline" className="text-success border-success">Approved</Badge>;
    }
    if (actionType.includes("rejected") || actionType.includes("banned") || actionType.includes("delete")) {
      return <Badge variant="outline" className="text-destructive border-destructive">Action</Badge>;
    }
    if (actionType.includes("created") || actionType.includes("insert")) {
      return <Badge variant="outline" className="text-primary border-primary">Created</Badge>;
    }
    if (actionType.includes("updated") || actionType.includes("update")) {
      return <Badge variant="outline" className="text-warning border-warning">Updated</Badge>;
    }
    return <Badge variant="outline">{actionType.replace(/_/g, " ")}</Badge>;
  };

  const formatActionDetails = (details: any): string => {
    if (!details) return "";
    if (typeof details === "string") return details;
    if (typeof details === "object") {
      return JSON.stringify(details).slice(0, 100);
    }
    return String(details);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatActionDetails(log.action_details).toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className="flex justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl font-bold">Activity Log</h1>
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-muted-foreground">Monitor all admin actions on the platform (Owner only)</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by action..."
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
            <SelectItem value="delete">Deletions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl p-12 text-center"
          >
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">No activity found</h3>
            <p className="text-muted-foreground">
              {logs.length === 0 
                ? "No admin actions have been logged yet"
                : "Adjust your filters to see more results"}
            </p>
          </motion.div>
        ) : (
          filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="glass-card rounded-xl p-4 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">
                    {log.admin_id.slice(0, 8)}...
                  </span>
                  {getActionBadge(log.action_type)}
                </div>
                <p className="font-medium">{log.action_type.replace(/_/g, " ")}</p>
                {log.action_details && (
                  <p className="text-sm text-muted-foreground truncate">
                    {formatActionDetails(log.action_details)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(log.created_at), "dd MMM yyyy, HH:mm:ss")}
                </p>
              </div>
              {log.target_type && (
                <Badge variant="outline" className="capitalize">
                  {log.target_type}
                </Badge>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminActivityLog;
