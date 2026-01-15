import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminFooter = () => {
  const [settings, setSettings] = useState({ id: "", description: "", twitter_url: "", instagram_url: "", youtube_url: "", tiktok_url: "", linkedin_url: "", facebook_url: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from("footer_settings").select("*").limit(1).maybeSingle();
      if (data) setSettings({ id: data.id, description: data.description || "", twitter_url: data.twitter_url || "", instagram_url: data.instagram_url || "", youtube_url: data.youtube_url || "", tiktok_url: data.tiktok_url || "", linkedin_url: data.linkedin_url || "", facebook_url: data.facebook_url || "" });
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("footer_settings").update({ description: settings.description, twitter_url: settings.twitter_url || null, instagram_url: settings.instagram_url || null, youtube_url: settings.youtube_url || null, tiktok_url: settings.tiktok_url || null, linkedin_url: settings.linkedin_url || null, facebook_url: settings.facebook_url || null }).eq("id", settings.id);
      if (error) throw error;
      toast.success("Footer settings saved!");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4"><div><h1 className="font-display text-2xl font-bold mb-1">Footer Settings</h1><p className="text-muted-foreground">Configure footer content and social links</p></div><Button variant="outline" size="sm" onClick={fetchSettings}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-6 max-w-2xl">
        <div><label className="text-sm text-muted-foreground mb-2 block">Description</label><Textarea value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} rows={2} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-muted-foreground mb-2 block">Twitter URL</label><Input value={settings.twitter_url} onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })} /></div>
          <div><label className="text-sm text-muted-foreground mb-2 block">Instagram URL</label><Input value={settings.instagram_url} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} /></div>
          <div><label className="text-sm text-muted-foreground mb-2 block">YouTube URL</label><Input value={settings.youtube_url} onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })} /></div>
          <div><label className="text-sm text-muted-foreground mb-2 block">TikTok URL</label><Input value={settings.tiktok_url} onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })} /></div>
        </div>
        <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Settings"}</Button>
      </motion.div>
    </div>
  );
};

export default AdminFooter;
