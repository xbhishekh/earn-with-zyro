import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AdminSupportSettings = () => {
  const [settings, setSettings] = useState({
    welcomeMessage: "Hi! How can we help you today?",
    offlineMessage: "We're currently offline. Leave a message and we'll get back to you.",
    activeHoursStart: "09:00",
    activeHoursEnd: "18:00",
  });

  const handleSave = () => toast.success("Settings saved!");

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold mb-1">Support Settings</h1><p className="text-muted-foreground">Configure support chat settings</p></div>

      <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground"><strong>Note:</strong> Support config table needs to be created. Placeholder UI shown.</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-6 max-w-2xl">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Welcome Message</label>
          <Textarea value={settings.welcomeMessage} onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })} rows={3} />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Offline Message</label>
          <Textarea value={settings.offlineMessage} onChange={(e) => setSettings({ ...settings, offlineMessage: e.target.value })} rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Active Hours Start</label>
            <Input type="time" value={settings.activeHoursStart} onChange={(e) => setSettings({ ...settings, activeHoursStart: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Active Hours End</label>
            <Input type="time" value={settings.activeHoursEnd} onChange={(e) => setSettings({ ...settings, activeHoursEnd: e.target.value })} />
          </div>
        </div>

        <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save Settings</Button>
      </motion.div>
    </div>
  );
};

export default AdminSupportSettings;
