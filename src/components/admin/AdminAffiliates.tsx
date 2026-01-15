import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Link2, Users, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminAffiliates = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Placeholder data
  const affiliates = [
    { id: "1", username: "creator1", code: "CREATOR1", clicks: 150, signups: 25, conversions: 12, earnings: 2400 },
    { id: "2", username: "creator2", code: "CREATOR2", clicks: 89, signups: 15, conversions: 8, earnings: 1600 },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold mb-1">Affiliate Management</h1><p className="text-muted-foreground">View all affiliate links and stats</p></div>

      <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground"><strong>Note:</strong> Affiliate links table needs to be created. Placeholder data shown.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Link2 className="w-5 h-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Clicks</p><p className="font-display text-xl font-bold">239</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Users className="w-5 h-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Signups</p><p className="font-display text-xl font-bold">40</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Earnings</p><p className="font-display text-xl font-bold">₹4,000</p></div></div>
        </motion.div>
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search affiliates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Code</TableHead><TableHead>Clicks</TableHead><TableHead>Signups</TableHead><TableHead>Conversions</TableHead><TableHead>Earnings</TableHead></TableRow></TableHeader>
          <TableBody>
            {affiliates.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">@{a.username}</TableCell>
                <TableCell><Badge variant="outline">{a.code}</Badge></TableCell>
                <TableCell>{a.clicks}</TableCell>
                <TableCell>{a.signups}</TableCell>
                <TableCell>{a.conversions}</TableCell>
                <TableCell className="font-display font-bold text-success">₹{a.earnings.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
};

export default AdminAffiliates;
