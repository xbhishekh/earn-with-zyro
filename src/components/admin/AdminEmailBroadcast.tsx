import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Users, MessageSquare, Loader2, Trash2, History, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BroadcastRecord {
  id: string;
  admin_id: string;
  title: string;
  content: string;
  recipients_count: number;
  created_at: string;
  deleted_at: string | null;
  admin_username?: string;
}

const AdminEmailBroadcast = () => {
  const { user, isSuperAdmin, isOwner, isFounder } = useAuth();
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [sending, setSending] = useState(false);
  const [userCount, setUserCount] = useState<number>(0);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManageBroadcasts = isSuperAdmin || isOwner || isFounder;

  useEffect(() => {
    fetchUserCount();
    if (canManageBroadcasts) {
      fetchBroadcastHistory();
    }
  }, [canManageBroadcasts]);

  const fetchUserCount = async () => {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    setUserCount(count || 0);
  };

  const fetchBroadcastHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("broadcast_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch admin usernames
      if (data && data.length > 0) {
        const adminIds = [...new Set(data.map(b => b.admin_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, display_name")
          .in("user_id", adminIds);

        const enriched = data.map(b => ({
          ...b,
          admin_username: profiles?.find(p => p.user_id === b.admin_id)?.username ||
                          profiles?.find(p => p.user_id === b.admin_id)?.display_name ||
                          "Admin",
        }));
        setBroadcastHistory(enriched);
      } else {
        setBroadcastHistory([]);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content required");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.rpc("send_admin_broadcast_dm", {
        p_title: formData.title.trim(),
        p_content: formData.content.trim(),
      });

      if (error) throw error;

      toast.success(`Broadcast sent to ${data} users!`);
      setFormData({ title: "", content: "" });
      fetchBroadcastHistory();
    } catch (error) {
      console.error("Broadcast error:", error);
      toast.error("Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteBroadcast = async (broadcast: BroadcastRecord) => {
    setDeletingId(broadcast.id);
    try {
      const { data, error } = await supabase.rpc("delete_broadcast_messages", {
        p_broadcast_id: broadcast.id,
        p_title: broadcast.title,
        p_content: broadcast.content,
      });

      if (error) throw error;

      toast.success(`Broadcast deleted from ${data} users' messages!`);
      fetchBroadcastHistory();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete broadcast");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Company Broadcast</h1>
        <p className="text-muted-foreground">Send official announcements to all users via DM</p>
      </div>

      <div className="glass-card rounded-xl p-4 border-l-4 border-l-warning">
        <p className="text-sm text-muted-foreground">
          <strong>⚠️ Warning:</strong> This will send a DM from Team CliporaX to ALL users. Use for important announcements only.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recipients</p>
              <p className="font-display text-xl font-bold">{userCount.toLocaleString()} Users</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Method</p>
              <p className="font-display text-xl font-bold">Team CliporaX DM</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl p-6 space-y-6"
        >
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Title *</label>
            <Input
              placeholder="Announcement title (e.g., New Feature Launch!)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Content *</label>
            <Textarea
              placeholder="Write your announcement message..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-2">
              This message will appear as a DM from Team CliporaX with verified badge.
            </p>
          </div>

          {/* Preview */}
          {formData.title && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
              <div className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-lg p-4 border">
                <p className="font-semibold">📢 {formData.title}</p>
                <p className="text-sm mt-2 whitespace-pre-wrap">{formData.content}</p>
                <p className="text-xs text-muted-foreground mt-3 italic">_Team CliporaX_</p>
              </div>
            </div>
          )}

          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending to {userCount} users...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Broadcast to All Users
              </>
            )}
          </Button>
        </motion.div>

        {/* Broadcast History */}
        {canManageBroadcasts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold">Broadcast History</h2>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : broadcastHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No broadcasts sent yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {broadcastHistory.map((broadcast) => (
                    <div
                      key={broadcast.id}
                      className={`border rounded-lg p-4 ${broadcast.deleted_at ? "opacity-50 bg-muted/30" : "bg-background"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              📢 {broadcast.title}
                            </span>
                            {broadcast.deleted_at && (
                              <span className="text-xs text-destructive font-medium">Deleted</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {broadcast.content}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(broadcast.created_at), "MMM d, yyyy h:mm a")}
                            </span>
                            <span>•</span>
                            <span>{broadcast.recipients_count} users</span>
                            <span>•</span>
                            <span>by @{broadcast.admin_username}</span>
                          </div>
                        </div>

                        {!broadcast.deleted_at && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={deletingId === broadcast.id}
                              >
                                {deletingId === broadcast.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Broadcast?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this broadcast message from <strong>ALL users' DMs</strong>. 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteBroadcast(broadcast)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete for Everyone
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminEmailBroadcast;
