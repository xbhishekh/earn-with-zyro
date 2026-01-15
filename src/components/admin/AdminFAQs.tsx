import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, HelpCircle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const AdminFAQs = () => {
  const [faqs, setFaqs] = useState([
    { id: "1", category: "General", question: "How do I earn money?", answer: "Create content for campaigns and get paid per 1000 views." },
    { id: "2", category: "Payments", question: "When do I get paid?", answer: "Payments are processed weekly for approved submissions." },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ category: "", question: "", answer: "" });

  const handleSubmit = () => {
    if (!formData.question.trim() || !formData.answer.trim()) { toast.error("All fields required"); return; }
    toast.success("FAQ saved!");
    setIsModalOpen(false);
    setFormData({ category: "", question: "", answer: "" });
  };

  const handleDelete = (id: string) => { toast.success("FAQ deleted"); setFaqs(faqs.filter(f => f.id !== id)); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold mb-1">FAQ Management</h1><p className="text-muted-foreground">Manage frequently asked questions</p></div>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Add FAQ</Button>
      </div>

      <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground"><strong>Note:</strong> FAQs table needs to be created. Placeholder data shown.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <motion.div key={faq.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-xs text-primary font-medium">{faq.category}</span>
                <h3 className="font-display font-bold mt-1">{faq.question}</h3>
                <p className="text-muted-foreground mt-2">{faq.answer}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(faq.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add FAQ</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Category (e.g., General, Payments)" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            <Input placeholder="Question" value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} />
            <Textarea placeholder="Answer" value={formData.answer} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} rows={4} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFAQs;
