import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const AdminCompanyPages = () => {
  const [pages, setPages] = useState({
    about: { title: "About Us", content: "Zyrozo is India's #1 Creator Rewards Platform..." },
    contact: { title: "Contact Us", content: "Get in touch with us..." },
    careers: { title: "Careers", content: "Join our team..." },
  });

  const handleSave = (type: string) => toast.success(`${type} saved!`);

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold mb-1">Company Pages</h1><p className="text-muted-foreground">Edit About, Contact, and Careers pages</p></div>

      <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground"><strong>Note:</strong> Company pages table needs to be created. Placeholder UI shown.</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6">
        <Tabs defaultValue="about">
          <TabsList><TabsTrigger value="about">About</TabsTrigger><TabsTrigger value="contact">Contact</TabsTrigger><TabsTrigger value="careers">Careers</TabsTrigger></TabsList>

          {(["about", "contact", "careers"] as const).map(key => (
            <TabsContent key={key} value={key} className="space-y-4 mt-4">
              <div><label className="text-sm text-muted-foreground mb-2 block">Title</label><Input value={pages[key].title} onChange={(e) => setPages({ ...pages, [key]: { ...pages[key], title: e.target.value } })} /></div>
              <div><label className="text-sm text-muted-foreground mb-2 block">Content</label><Textarea value={pages[key].content} onChange={(e) => setPages({ ...pages, [key]: { ...pages[key], content: e.target.value } })} rows={15} /></div>
              <Button onClick={() => handleSave(pages[key].title)}><Save className="w-4 h-4 mr-2" />Save</Button>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AdminCompanyPages;
