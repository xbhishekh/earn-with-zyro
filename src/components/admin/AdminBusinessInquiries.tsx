import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, Building2, Mail, Phone, Globe, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Inquiry {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  budget_range: string | null;
  campaign_goal: string | null;
  preferred_call_time: string | null;
  message: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUSES = ["new", "contacted", "call_booked", "won", "lost"];

const statusColor: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-blue-500/10 text-blue-500",
  call_booked: "bg-amber-500/10 text-amber-600",
  won: "bg-emerald-500/10 text-emerald-600",
  lost: "bg-destructive/10 text-destructive",
};

const AdminBusinessInquiries = () => {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("business_inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load inquiries");
    setItems((data as Inquiry[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateInquiry = async (id: string, patch: Partial<Inquiry>) => {
    const { error } = await supabase.from("business_inquiries").update(patch).eq("id", id);
    if (error) {
      toast.error("Update failed");
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    toast.success("Saved");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("business_inquiries").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Deleted");
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((i) => {
      const matchesStatus = statusFilter === "all" || i.status === statusFilter;
      const matchesQuery =
        !q ||
        i.company_name.toLowerCase().includes(q) ||
        i.contact_name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [items, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Business Inquiries</h1>
        <p className="text-muted-foreground text-sm">Campaign requests and call bookings from brands.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, name or email"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
            No business inquiries yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((i) => (
            <Card key={i.id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{i.company_name}</h3>
                      <Badge className={statusColor[i.status] || ""} variant="secondary">
                        {i.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {i.contact_name} · {new Date(i.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={i.status} onValueChange={(v) => updateInquiry(i.id, { status: v })}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => remove(i.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <a href={`mailto:${i.email}`} className="flex items-center gap-2 hover:text-primary">
                    <Mail className="w-4 h-4 text-muted-foreground" /> {i.email}
                  </a>
                  {i.phone && (
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" /> {i.phone}
                    </span>
                  )}
                  {i.website && (
                    <a
                      href={i.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-2 hover:text-primary truncate"
                    >
                      <Globe className="w-4 h-4 text-muted-foreground" /> {i.website}
                    </a>
                  )}
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Goal</p>
                    <p>{i.campaign_goal || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Budget</p>
                    <p>{i.budget_range || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Preferred call time</p>
                    <p>{i.preferred_call_time || "—"}</p>
                  </div>
                </div>

                {i.message && (
                  <div className="bg-muted/40 rounded-lg p-3 text-sm whitespace-pre-wrap">{i.message}</div>
                )}

                <InquiryReplyBox
                  inquiryId={i.id}
                  companyName={i.company_name}
                  email={i.email}
                  onSent={() => setItems((prev) => prev.map((x) => (x.id === i.id && x.status === "new" ? { ...x, status: "contacted" } : x)))}
                />

                <div className="space-y-2">

                  <p className="text-xs text-muted-foreground">Internal notes</p>
                  <Textarea
                    defaultValue={i.admin_notes || ""}
                    rows={2}
                    placeholder="Add a note..."
                    onBlur={(e) => {
                      if (e.target.value !== (i.admin_notes || "")) {
                        updateInquiry(i.id, { admin_notes: e.target.value });
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBusinessInquiries;
