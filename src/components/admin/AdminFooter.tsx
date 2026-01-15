import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AdminFooter = () => {
  const [settings, setSettings] = useState({
    description: "India's #1 Creator Rewards Platform",
    twitter_url: "https://twitter.com/zyrozo",
    instagram_url: "https://instagram.com/zyrozo",
    youtube_url: "https://youtube.com/@zyrozo",
    tiktok_url: "",
    linkedin_url: "",
  });

  const handleSave = () => toast.success("Footer settings saved!");

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold mb-1">Footer Settings</h1><p className="text-muted-foreground">Configure footer content and social links</p></div>

      <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground"><strong>Note:</strong> Footer settings table needs to be created. Placeholder UI shown.</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-6 max-w-2xl">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Description</label>
          <Textarea value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-muted-foreground mb-2 block">Twitter URL</label><Input value={settings.twitter_url} onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })} /></div>
          <div><label className="text-sm text-muted-foreground mb-2 block">Instagram URL</label><Input value={settings.instagram_url} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} /></div>
          <div><label className="text-sm text-muted-foreground mb-2 block">YouTube URL</label><Input value={settings.youtube_url} onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })} /></div>
          <div><label className="text-sm text-muted-foreground mb-2 block">TikTok URL</label><Input value={settings.tiktok_url} onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })} /></div>
        </div>

        <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save Settings</Button>
      </motion.div>
    </div>
  );
};

export default AdminFooter;
