import { useState } from "react";
import { motion } from "framer-motion";
import { Radio, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AdminEmailBroadcast = () => {
  const [formData, setFormData] = useState({ subject: "", content: "" });
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!formData.subject.trim() || !formData.content.trim()) { toast.error("Subject and content required"); return; }
    setSending(true);
    setTimeout(() => {
      toast.success("Email broadcast sent!");
      setFormData({ subject: "", content: "" });
      setSending(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold mb-1">Email Broadcast</h1><p className="text-muted-foreground">Send mass emails to all users</p></div>

      <div className="glass-card rounded-xl p-4 border-l-4 border-l-warning">
        <p className="text-sm text-muted-foreground"><strong>⚠️ Warning:</strong> This will send an email to ALL users. Use with caution.</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 inline-block">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Recipients</p><p className="font-display text-xl font-bold">5,000+ Users</p></div></div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-6 max-w-2xl">
        <div><label className="text-sm text-muted-foreground mb-2 block">Subject *</label><Input placeholder="Email subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} /></div>
        <div><label className="text-sm text-muted-foreground mb-2 block">Content *</label><Textarea placeholder="Email content..." value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={10} /></div>
        <Button onClick={handleSend} disabled={sending} className="w-full">{sending ? "Sending..." : <><Send className="w-4 h-4 mr-2" />Send Broadcast</>}</Button>
      </motion.div>
    </div>
  );
};

export default AdminEmailBroadcast;
