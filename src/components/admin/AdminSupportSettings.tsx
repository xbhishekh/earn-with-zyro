import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminSupportSettings = () => {
  const [settings, setSettings] = useState({
    id: "",
    welcome_message: "",
    offline_message: "",
    active_hours_start: "09:00",
    active_hours_end: "18:00",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("support_config").select("*").limit(1).maybeSingle();
      if (error) throw error;
      if (data) {
        setSettings({
          id: data.id,
          welcome_message: data.welcome_message || "",
          offline_message: data.offline_message || "",
          active_hours_start: data.active_hours_start || "09:00",
          active_hours_end: data.active_hours_end || "18:00",
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("support_config").update({
        welcome_message: settings.welcome_message,
        offline_message: settings.offline_message,
        active_hours_start: settings.active_hours_start,
        active_hours_end: settings.active_hours_end,
      }).eq("id", settings.id);
      if (error) throw error;
      toast.success("Settings saved!");
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold mb-1">Support Settings</h1><p className="text-muted-foreground">Configure support chat settings</p></div>
        <Button variant="outline" size="sm" onClick={fetchSettings}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-6 max-w-2xl">
        <div><label className="text-sm text-muted-foreground mb-2 block">Welcome Message</label><Textarea value={settings.welcome_message} onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })} rows={3} /></div>
        <div><label className="text-sm text-muted-foreground mb-2 block">Offline Message</label><Textarea value={settings.offline_message} onChange={(e) => setSettings({ ...settings, offline_message: e.target.value })} rows={3} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-muted-foreground mb-2 block">Active Hours Start</label><Input type="time" value={settings.active_hours_start} onChange={(e) => setSettings({ ...settings, active_hours_start: e.target.value })} /></div>
          <div><label className="text-sm text-muted-foreground mb-2 block">Active Hours End</label><Input type="time" value={settings.active_hours_end} onChange={(e) => setSettings({ ...settings, active_hours_end: e.target.value })} /></div>
        </div>
        <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Settings"}</Button>
      </motion.div>
    </div>
  );
};

export default AdminSupportSettings;
