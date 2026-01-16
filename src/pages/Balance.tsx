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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";

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
  const { user, loading: authLoading, signOut } = useAuth();
  const [balance, setBalance] = useState<BalanceData>({ available: 0, pending: 0, total: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  
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

      // Calculate balances
      let available = 0;
      let pending = 0;
      let total = 0;

      txns?.forEach((tx) => {
        const amount = Number(tx.amount);
        if (tx.status === "available" || tx.status === "paid") {
          available += amount;
        } else if (tx.status === "pending") {
          pending += amount;
        }
        if (tx.type !== "withdrawal") {
          total += amount;
        }
      });

      setBalance({ available, pending, total });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-warning";
      case "available": case "completed": case "paid": return "text-success";
      case "rejected": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

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
              <p className="font-display text-2xl font-bold">₹{card.value.toLocaleString()}</p>
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
                      <p className="font-medium">₹{Number(w.amount).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(w.created_at), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <span className="text-sm text-warning font-medium">Processing</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transaction History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-2xl p-6">
          <h2 className="font-display text-xl font-bold mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    {tx.type === "withdrawal" ? (
                      <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <Send className="w-5 h-5 text-destructive" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-success" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium capitalize">{tx.type.replace("_", " ")}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(tx.created_at), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${tx.type === "withdrawal" ? "text-destructive" : "text-success"}`}>
                      {tx.type === "withdrawal" ? "-" : "+"}₹{Math.abs(Number(tx.amount)).toLocaleString()}
                    </p>
                    <p className={`text-sm capitalize ${getStatusColor(tx.status || "pending")}`}>{tx.status}</p>
                  </div>
                </div>
              ))}
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
              <p className="text-sm text-muted-foreground mt-1">Available: ₹{balance.available.toLocaleString()}</p>
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
