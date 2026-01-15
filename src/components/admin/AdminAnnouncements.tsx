import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Megaphone, Trash2, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

// Placeholder - announcements table needs to be created
const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([
    { id: "1", title: "Welcome to Zyrozo!", content: "Start creating content today.", is_pinned: true, campaign_name: "Global", created_at: new Date().toISOString() },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "", is_pinned: false });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content required");
      return;
    }
    toast.success("Announcement created!");
    setIsModalOpen(false);
    setFormData({ title: "", content: "", is_pinned: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Announcements</h1>
          <p className="text-muted-foreground">Broadcast messages to creators</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Announcements table needs to be created. This is a placeholder UI.
        </p>
      </div>

      <div className="space-y-4">
        {announcements.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              {a.is_pinned && <Pin className="w-4 h-4 text-primary" />}
              <h3 className="font-display font-bold">{a.title}</h3>
              <Badge variant="outline">{a.campaign_name}</Badge>
            </div>
            <p className="text-muted-foreground">{a.content}</p>
            <p className="text-xs text-muted-foreground mt-2">{format(new Date(a.created_at), "dd MMM yyyy")}</p>
          </motion.div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            <Textarea placeholder="Content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;
