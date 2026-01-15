import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface FAQ { id: string; category: string; question: string; answer: string; is_active: boolean; sort_order: number; }

const AdminFAQs = () => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({ category: "", question: "", answer: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchFAQs(); }, []);

  const fetchFAQs = async () => {
    try {
      const { data } = await supabase.from("faqs").select("*").order("sort_order", { ascending: true });
      setFaqs(data || []);
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) { toast.error("Question and answer required"); return; }
    setSubmitting(true);
    try {
      if (editing) {
        const { error } = await supabase.from("faqs").update({ category: formData.category, question: formData.question, answer: formData.answer }).eq("id", editing.id);
        if (error) throw error;
        toast.success("FAQ updated!");
      } else {
        const { error } = await supabase.from("faqs").insert({ category: formData.category || "General", question: formData.question, answer: formData.answer, created_by: user?.id });
        if (error) throw error;
        toast.success("FAQ created!");
      }
      setIsModalOpen(false);
      setEditing(null);
      setFormData({ category: "", question: "", answer: "" });
      fetchFAQs();
    } catch { toast.error("Failed to save"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
      fetchFAQs();
    } catch { toast.error("Failed to delete"); }
  };

  const openEdit = (faq: FAQ) => { setEditing(faq); setFormData({ category: faq.category, question: faq.question, answer: faq.answer }); setIsModalOpen(true); };
  const openCreate = () => { setEditing(null); setFormData({ category: "", question: "", answer: "" }); setIsModalOpen(true); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold mb-1">FAQ Management</h1><p className="text-muted-foreground">Manage frequently asked questions</p></div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={fetchFAQs}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button><Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add FAQ</Button></div>
      </div>

      {faqs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No FAQs yet. Create your first one!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div key={faq.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="glass-card rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="text-xs text-primary font-medium">{faq.category}</span>
                  <h3 className="font-display font-bold mt-1">{faq.question}</h3>
                  <p className="text-muted-foreground mt-2">{faq.answer}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(faq)}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(faq.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Category (e.g., General, Payments)" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            <Input placeholder="Question" value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} />
            <Textarea placeholder="Answer" value={formData.answer} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} rows={4} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFAQs;
