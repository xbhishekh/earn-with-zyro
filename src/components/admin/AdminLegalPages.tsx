import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const AdminLegalPages = () => {
  const [pages, setPages] = useState({
    privacy: { title: "Privacy Policy", content: "Your privacy is important to us..." },
    terms: { title: "Terms of Service", content: "By using Zyrozo, you agree to..." },
  });

  const handleSave = (type: string) => toast.success(`${type} saved!`);

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold mb-1">Legal Pages</h1><p className="text-muted-foreground">Edit Privacy Policy and Terms of Service</p></div>

      <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground"><strong>Note:</strong> Legal pages table needs to be created. Placeholder UI shown.</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6">
        <Tabs defaultValue="privacy">
          <TabsList><TabsTrigger value="privacy">Privacy Policy</TabsTrigger><TabsTrigger value="terms">Terms of Service</TabsTrigger></TabsList>

          <TabsContent value="privacy" className="space-y-4 mt-4">
            <div><label className="text-sm text-muted-foreground mb-2 block">Title</label><Input value={pages.privacy.title} onChange={(e) => setPages({ ...pages, privacy: { ...pages.privacy, title: e.target.value } })} /></div>
            <div><label className="text-sm text-muted-foreground mb-2 block">Content</label><Textarea value={pages.privacy.content} onChange={(e) => setPages({ ...pages, privacy: { ...pages.privacy, content: e.target.value } })} rows={15} /></div>
            <Button onClick={() => handleSave("Privacy Policy")}><Save className="w-4 h-4 mr-2" />Save</Button>
          </TabsContent>

          <TabsContent value="terms" className="space-y-4 mt-4">
            <div><label className="text-sm text-muted-foreground mb-2 block">Title</label><Input value={pages.terms.title} onChange={(e) => setPages({ ...pages, terms: { ...pages.terms, title: e.target.value } })} /></div>
            <div><label className="text-sm text-muted-foreground mb-2 block">Content</label><Textarea value={pages.terms.content} onChange={(e) => setPages({ ...pages, terms: { ...pages.terms, content: e.target.value } })} rows={15} /></div>
            <Button onClick={() => handleSave("Terms of Service")}><Save className="w-4 h-4 mr-2" />Save</Button>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AdminLegalPages;
