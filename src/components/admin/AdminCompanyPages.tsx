import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminCompanyPages = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPages(); }, []);

  const fetchPages = async () => {
    try {
      const { data } = await supabase.from("company_pages").select("*");
      setPages(data || []);
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); }
  };

  const handleSave = async (pageType: string) => {
    const page = pages.find(p => p.page_type === pageType);
    if (!page) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("company_pages").update({ title: page.title, content: page.content, meta_description: page.meta_description }).eq("id", page.id);
      if (error) throw error;
      toast.success(`${page.title} saved!`);
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const updatePage = (pageType: string, field: string, value: string) => {
    setPages(pages.map(p => p.page_type === pageType ? { ...p, [field]: value } : p));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4"><div><h1 className="font-display text-2xl font-bold mb-1">Company Pages</h1><p className="text-muted-foreground">Edit About, Contact, and Careers pages</p></div><Button variant="outline" size="sm" onClick={fetchPages}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6">
        <Tabs defaultValue="about">
          <TabsList><TabsTrigger value="about">About</TabsTrigger><TabsTrigger value="contact">Contact</TabsTrigger><TabsTrigger value="careers">Careers</TabsTrigger></TabsList>
          {(["about", "contact", "careers"] as const).map(key => {
            const page = pages.find(p => p.page_type === key) || { title: "", content: "", meta_description: "" };
            return (
              <TabsContent key={key} value={key} className="space-y-4 mt-4">
                <div><label className="text-sm text-muted-foreground mb-2 block">Title</label><Input value={page.title} onChange={(e) => updatePage(key, "title", e.target.value)} /></div>
                <div><label className="text-sm text-muted-foreground mb-2 block">Meta Description</label><Input value={page.meta_description || ""} onChange={(e) => updatePage(key, "meta_description", e.target.value)} /></div>
                <div><label className="text-sm text-muted-foreground mb-2 block">Content (Markdown)</label><Textarea value={page.content} onChange={(e) => updatePage(key, "content", e.target.value)} rows={15} /></div>
                <Button onClick={() => handleSave(key)} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save"}</Button>
              </TabsContent>
            );
          })}
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AdminCompanyPages;
