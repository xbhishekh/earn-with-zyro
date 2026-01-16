import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Ticket, Plus, Edit2, Trash2, Loader2, Copy, Check, Calendar, Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  product_id: string | null;
  min_purchase_amount: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  product?: { title: string } | null;
}

interface Product {
  id: string;
  title: string;
}

interface DiscountCodesManagerProps {
  products?: Product[];
}

const DiscountCodesManager = ({ products: propProducts }: DiscountCodesManagerProps = {}) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(propProducts || []);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    product_id: "all",
    min_purchase_amount: "",
    max_uses: "",
    starts_at: "",
    expires_at: "",
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchDiscountCodes();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user || propProducts) return;
    
    const { data } = await supabase
      .from("marketplace_products")
      .select("id, title")
      .eq("seller_id", user.id);
    
    if (data) {
      setProducts(data);
    }
  };

  const fetchDiscountCodes = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch discount codes");
    } else {
      setDiscountCodes(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      product_id: "all",
      min_purchase_amount: "",
      max_uses: "",
      starts_at: "",
      expires_at: "",
      is_active: true,
    });
    setEditingCode(null);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSave = async () => {
    if (!user || !formData.code || !formData.discount_value) {
      toast.error("Please fill required fields");
      return;
    }

    setSaving(true);

    const codeData = {
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      product_id: formData.product_id === "all" ? null : formData.product_id,
      seller_id: user.id,
      min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : 0,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      starts_at: formData.starts_at || null,
      expires_at: formData.expires_at || null,
      is_active: formData.is_active,
    };

    try {
      if (editingCode) {
        const { error } = await supabase
          .from("discount_codes")
          .update(codeData)
          .eq("id", editingCode.id);

        if (error) throw error;
        toast.success("Discount code updated");
      } else {
        const { error } = await supabase
          .from("discount_codes")
          .insert(codeData);

        if (error) throw error;
        toast.success("Discount code created");
      }

      fetchDiscountCodes();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save discount code");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      product_id: code.product_id || "all",
      min_purchase_amount: code.min_purchase_amount?.toString() || "",
      max_uses: code.max_uses?.toString() || "",
      starts_at: code.starts_at ? code.starts_at.split("T")[0] : "",
      expires_at: code.expires_at ? code.expires_at.split("T")[0] : "",
      is_active: code.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (codeId: string) => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;

    const { error } = await supabase
      .from("discount_codes")
      .delete()
      .eq("id", codeId);

    if (error) {
      toast.error("Failed to delete discount code");
    } else {
      toast.success("Discount code deleted");
      fetchDiscountCodes();
    }
  };

  const toggleActive = async (code: DiscountCode) => {
    const { error } = await supabase
      .from("discount_codes")
      .update({ is_active: !code.is_active })
      .eq("id", code.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      setDiscountCodes(prev => prev.map(c => 
        c.id === code.id ? { ...c, is_active: !c.is_active } : c
      ));
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Discount Codes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create promotional codes for your products
              </p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Code
          </Button>
        </CardHeader>
        <CardContent>
          {discountCodes.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No discount codes yet</p>
              <Button variant="outline" onClick={() => { resetForm(); setShowModal(true); }}>
                Create Your First Code
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {code.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyCode(code.code, code.id)}
                        >
                          {copiedId === code.id ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {code.discount_type === "percentage" 
                          ? `${code.discount_value}%` 
                          : `₹${code.discount_value}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {code.product ? (
                        <span className="text-sm">{code.product.title}</span>
                      ) : (
                        <Badge variant="outline">All Products</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {code.current_uses}{code.max_uses ? `/${code.max_uses}` : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={code.is_active}
                          onCheckedChange={() => toggleActive(code)}
                        />
                        {isExpired(code.expires_at) && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(code)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(code.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => {
        setShowModal(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCode ? "Edit Discount Code" : "Create Discount Code"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., SUMMER20"
                  className="font-mono"
                />
                <Button variant="outline" onClick={generateCode} type="button">
                  Generate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select 
                  value={formData.discount_type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, discount_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                  placeholder={formData.discount_type === "percentage" ? "e.g., 20" : "e.g., 100"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Apply to Product</Label>
              <Select 
                value={formData.product_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, product_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Purchase (₹)</Label>
                <Input
                  type="number"
                  value={formData.min_purchase_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_purchase_amount: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.starts_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DiscountCodesManager;
