import { useState, useEffect } from "react";
import { ArrowDownLeft, ArrowUpRight, Loader2, History } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface TransactionHistoryProps {
  userId: string;
}

export const TransactionHistory = ({ userId }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("balance_transactions")
        .select("id, amount, type, status, notes, created_at")
        .eq("user_id", userId)
        .in("type", ["transfer_in", "transfer_out"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractUsername = (notes: string | null): string => {
    if (!notes) return "User";
    // Extract username from notes like "Transfer to @username" or "Transfer received"
    const match = notes.match(/@(\w+)/);
    return match ? match[1] : "User";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No transfer history</p>
        <p className="text-sm">Your sent and received payments will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <History className="w-4 h-4" />
        Transfer History
      </h4>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {transactions.map((tx) => {
          const isIncoming = tx.type === "transfer_in";
          const username = extractUsername(tx.notes);

          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isIncoming ? "bg-green-500/10" : "bg-red-500/10"
                }`}
              >
                {isIncoming ? (
                  <ArrowDownLeft className="w-5 h-5 text-green-500" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {isIncoming ? "Received from" : "Sent to"} @{username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(tx.created_at), "MMM d, yyyy • h:mm a")}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${
                    isIncoming ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {isIncoming ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionHistory;
