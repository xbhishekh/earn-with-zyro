import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Users, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminEmailBroadcast = () => {
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [sending, setSending] = useState(false);
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    fetchUserCount();
  }, []);

  const fetchUserCount = async () => {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    setUserCount(count || 0);
  };

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content required");
      return;
    }

    setSending(true);
    try {
      // Call the broadcast function to send DM to all users
      const { data, error } = await supabase.rpc("send_admin_broadcast_dm", {
        p_title: formData.title.trim(),
        p_content: formData.content.trim(),
      });

      if (error) throw error;

      toast.success(`Broadcast sent to ${data} users!`);
      setFormData({ title: "", content: "" });
    } catch (error) {
      console.error("Broadcast error:", error);
      toast.error("Failed to send broadcast");
    } finally {
      setSending(false);
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
          <strong>⚠️ Warning:</strong> This will send a DM from Team Zyrozo to ALL users. Use for important announcements only.
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
              <p className="font-display text-xl font-bold">Team Zyrozo DM</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl p-6 space-y-6 max-w-2xl"
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
            rows={8}
          />
          <p className="text-xs text-muted-foreground mt-2">
            This message will appear as a DM from Team Zyrozo with verified badge.
          </p>
        </div>

        {/* Preview */}
        {formData.title && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <div className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-lg p-4 border">
              <p className="font-semibold">📢 {formData.title}</p>
              <p className="text-sm mt-2 whitespace-pre-wrap">{formData.content}</p>
              <p className="text-xs text-muted-foreground mt-3 italic">_Team Zyrozo_</p>
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
    </div>
  );
};

export default AdminEmailBroadcast;