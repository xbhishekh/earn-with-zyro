import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminLegalPages = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPages(); }, []);

  const fetchPages = async () => {
    try {
      const { data } = await supabase.from("legal_pages").select("*");
      setPages(data || []);
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); }
  };

  const handleSave = async (pageType: string) => {
    const page = pages.find(p => p.page_type === pageType);
    if (!page) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("legal_pages").update({ title: page.title, content: page.content }).eq("id", page.id);
      if (error) throw error;
      toast.success(`${page.title} saved!`);
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const updatePage = (pageType: string, field: string, value: string) => {
    setPages(pages.map(p => p.page_type === pageType ? { ...p, [field]: value } : p));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const privacyPage = pages.find(p => p.page_type === "privacy") || { title: "", content: "" };
  const termsPage = pages.find(p => p.page_type === "terms") || { title: "", content: "" };

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4"><div><h1 className="font-display text-2xl font-bold mb-1">Legal Pages</h1><p className="text-muted-foreground">Edit Privacy Policy and Terms of Service</p></div><Button variant="outline" size="sm" onClick={fetchPages}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6">
        <Tabs defaultValue="privacy">
          <TabsList><TabsTrigger value="privacy">Privacy Policy</TabsTrigger><TabsTrigger value="terms">Terms of Service</TabsTrigger></TabsList>
          <TabsContent value="privacy" className="space-y-4 mt-4">
            <div><label className="text-sm text-muted-foreground mb-2 block">Title</label><Input value={privacyPage.title} onChange={(e) => updatePage("privacy", "title", e.target.value)} /></div>
            <div><label className="text-sm text-muted-foreground mb-2 block">Content (Markdown)</label><Textarea value={privacyPage.content} onChange={(e) => updatePage("privacy", "content", e.target.value)} rows={15} /></div>
            <Button onClick={() => handleSave("privacy")} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save"}</Button>
          </TabsContent>
          <TabsContent value="terms" className="space-y-4 mt-4">
            <div><label className="text-sm text-muted-foreground mb-2 block">Title</label><Input value={termsPage.title} onChange={(e) => updatePage("terms", "title", e.target.value)} /></div>
            <div><label className="text-sm text-muted-foreground mb-2 block">Content (Markdown)</label><Textarea value={termsPage.content} onChange={(e) => updatePage("terms", "content", e.target.value)} rows={15} /></div>
            <Button onClick={() => handleSave("terms")} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save"}</Button>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AdminLegalPages;
