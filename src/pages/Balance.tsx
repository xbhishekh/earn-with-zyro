import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Clock, 
  DollarSign, 
  ArrowUpRight,
  Send,
  Building2,
  Coins,
  Loader2,
  ArrowDownLeft,
  Minus,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { calculateBalances } from "@/lib/balance-utils";

interface BalanceData {
  available: number;
  pending: number;
  total: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  release_date: string | null;
  notes: string | null;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

const Balance = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState<BalanceData>({ available: 0, pending: 0, total: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "usdt">("bank");
  const [bankDetails, setBankDetails] = useState({ accountHolder: "", accountNumber: "", ifscCode: "" });
  const [usdtDetails, setUsdtDetails] = useState({ walletAddress: "", network: "TRC20" });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBalanceData();
    }
  }, [user]);

  const fetchBalanceData = async () => {
    try {
      // Fetch balance transactions
      const { data: txns, error: txnError } = await supabase
        .from("balance_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (txnError) throw txnError;

      // Calculate balances using centralized utility
      const calculatedBalance = calculateBalances(txns || []);
      setBalance(calculatedBalance);
      setTransactions(txns as Transaction[] || []);

      // Fetch withdrawal requests
      const { data: withdrawalData } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      setWithdrawals(withdrawalData as WithdrawalRequest[] || []);
    } catch (error) {
      console.error("Error fetching balance:", error);
      toast.error("Failed to load balance data");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      toast.error("Minimum withdrawal is $10");
      return;
    }

    if (amount > balance.available) {
      toast.error("Insufficient available balance");
      return;
    }

    setWithdrawing(true);
    try {
      const paymentDetails = paymentMethod === "bank" 
        ? { type: "bank", ...bankDetails }
        : { type: "usdt", ...usdtDetails };

      const { error } = await supabase.from("withdrawal_requests").insert({
        user_id: user!.id,
        amount,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        status: "pending"
      });

      if (error) throw error;

      toast.success("Withdrawal request submitted!");
      setShowWithdrawModal(false);
      fetchBalanceData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setWithdrawing(false);
    }
  };

  const getCreditType = (type: string): string => {
    const types: Record<string, string> = {
      "pending_payout": "Inner platform transfer",
      "payout": "Inner platform transfer",
      "withdrawal": "Withdrawal",
      "deposit": "Deposit",
      "affiliate_commission": "Affiliate commission",
      "referral_bonus": "Referral bonus",
      "product_sale": "Product sale",
      "deduction": "Deduction",
    };
    return types[type] || "Transfer";
  };

  const getStatusBadge = (status: string, releaseDate: string | null) => {
    if (status === "pending" && releaseDate) {
      const release = new Date(releaseDate);
      const now = new Date();
      if (release > now) {
        return (
          <Badge variant="outline" className="text-warning border-warning/50 text-xs">
            Pending
          </Badge>
        );
      }
    }
    
    const variants: Record<string, { className: string; label: string }> = {
      "pending": { className: "text-warning border-warning/50", label: "Pending" },
      "available": { className: "text-success border-success/50", label: "Completed" },
      "paid": { className: "text-success border-success/50", label: "Completed" },
      "completed": { className: "text-success border-success/50", label: "Completed" },
      "rejected": { className: "text-destructive border-destructive/50", label: "Rejected" },
    };
    
    const variant = variants[status] || variants["pending"];
    return (
      <Badge variant="outline" className={`${variant.className} text-xs`}>
        {variant.label}
      </Badge>
    );
  };

  const getFilteredTransactions = () => {
    switch (activeTab) {
      case "withdrawals":
        return transactions.filter(tx => tx.type === "withdrawal");
      case "deposits":
        return transactions.filter(tx => ["pending_payout", "payout", "deposit", "affiliate_commission", "referral_bonus", "product_sale"].includes(tx.type));
      case "deductions":
        return transactions.filter(tx => tx.type === "deduction");
      default:
        return transactions;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const balanceCards = [
    { title: "Available Balance", value: balance.available, icon: Wallet, color: "text-success", bgColor: "bg-success/10" },
    { title: "Pending Earnings", value: balance.pending, icon: Clock, color: "text-warning", bgColor: "bg-warning/10" },
    { title: "Total Earned", value: balance.total, icon: DollarSign, color: "text-primary", bgColor: "bg-primary/10" },
  ];

  const filteredTransactions = getFilteredTransactions();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Balance & Withdrawals</h1>
          <p className="text-muted-foreground">Manage your earnings and request withdrawals</p>
        </motion.div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {balanceCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm text-muted-foreground mb-1">{card.title}</h3>
              <p className="font-display text-2xl font-bold">${card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </motion.div>
          ))}
        </div>

        {/* Withdraw Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold mb-1">Request Withdrawal</h2>
              <p className="text-muted-foreground">Minimum withdrawal: $10</p>
            </div>
            <Button variant="hero" size="lg" onClick={() => setShowWithdrawModal(true)} disabled={balance.available < 10}>
              <Send className="w-5 h-5 mr-2" />
              Withdraw Funds
            </Button>
          </div>
        </motion.div>

        {/* Pending Withdrawals */}
        {withdrawals.filter(w => w.status === "pending").length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-6 mb-8">
            <h2 className="font-display text-xl font-bold mb-4">Pending Withdrawals</h2>
            <div className="space-y-3">
              {withdrawals.filter(w => w.status === "pending").map((w) => (
                <div key={w.id} className="flex items-center justify-between p-4 bg-warning/5 border border-warning/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-warning" />
                    <div>
                      <p className="font-medium">${Number(w.amount).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(w.created_at), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <span className="text-sm text-warning font-medium">Processing</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transaction History with Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-xl font-bold">Transaction History</h2>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                <TabsTrigger value="withdrawals" className="text-xs sm:text-sm">Withdrawals</TabsTrigger>
                <TabsTrigger value="deposits" className="text-xs sm:text-sm">Deposits</TabsTrigger>
                <TabsTrigger value="deductions" className="text-xs sm:text-sm">Deductions</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Net amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Credit type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Release date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time and date on</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 20).map((tx) => (
                    <tr key={tx.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4">
                        <span className={`font-medium ${tx.type === "withdrawal" || tx.type === "deduction" ? "text-destructive" : "text-success"}`}>
                          {tx.type === "withdrawal" || tx.type === "deduction" ? "-" : "+"}${Math.abs(Number(tx.amount)).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(tx.status, tx.release_date)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm">{getCreditType(tx.type)}</span>
                      </td>
                      <td className="py-4 px-4">
                        {tx.release_date ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {format(new Date(tx.release_date), "MMM dd, yyyy")}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <p>{format(new Date(tx.created_at), "MMM dd, yyyy")}</p>
                          <p className="text-muted-foreground text-xs">{format(new Date(tx.created_at), "h:mm a")}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {filteredTransactions.slice(0, 20).map((tx) => (
                  <div key={tx.id} className="p-4 bg-muted/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {tx.type === "withdrawal" || tx.type === "deduction" ? (
                          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            {tx.type === "withdrawal" ? (
                              <Send className="w-5 h-5 text-destructive" />
                            ) : (
                              <Minus className="w-5 h-5 text-destructive" />
                            )}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <ArrowDownLeft className="w-5 h-5 text-success" />
                          </div>
                        )}
                        <div>
                          <p className={`font-medium ${tx.type === "withdrawal" || tx.type === "deduction" ? "text-destructive" : "text-success"}`}>
                            {tx.type === "withdrawal" || tx.type === "deduction" ? "-" : "+"}${Math.abs(Number(tx.amount)).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">{getCreditType(tx.type)}</p>
                        </div>
                      </div>
                      {getStatusBadge(tx.status, tx.release_date)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(tx.created_at), "MMM dd, yyyy • h:mm a")}</span>
                      {tx.release_date && tx.status === "pending" && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Available: {format(new Date(tx.release_date), "MMM dd")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Withdrawal Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Amount (Min: $10)</Label>
              <Input type="number" placeholder="Enter amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} min={10} max={balance.available} />
              <p className="text-sm text-muted-foreground mt-1">Available: ${balance.available.toLocaleString()}</p>
            </div>

            <div>
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "bank" | "usdt")} className="mt-2">
                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="bank" id="bank" />
                  <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building2 className="w-5 h-5" />Bank Transfer
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="usdt" id="usdt" />
                  <Label htmlFor="usdt" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Coins className="w-5 h-5" />USDT
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === "bank" && (
              <div className="space-y-4">
                <div>
                  <Label>Account Holder Name</Label>
                  <Input value={bankDetails.accountHolder} onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })} />
                </div>
                <div>
                  <Label>IFSC Code</Label>
                  <Input value={bankDetails.ifscCode} onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })} />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input value={bankDetails.accountNumber} onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} />
                </div>
              </div>
            )}

            {paymentMethod === "usdt" && (
              <div className="space-y-4">
                <div>
                  <Label>Wallet Address</Label>
                  <Input value={usdtDetails.walletAddress} onChange={(e) => setUsdtDetails({ ...usdtDetails, walletAddress: e.target.value })} />
                </div>
                <div>
                  <Label>Network</Label>
                  <Select value={usdtDetails.network} onValueChange={(v) => setUsdtDetails({ ...usdtDetails, network: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                      <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                      <SelectItem value="BEP20">BEP20 (BSC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)}>Cancel</Button>
            <Button onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Balance;
