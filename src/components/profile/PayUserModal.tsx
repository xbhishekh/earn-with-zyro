import { useState, useEffect } from "react";
import { Search, DollarSign, Loader2, User, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface PayUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  availableBalance: number;
  onSuccess: () => void;
  preselectedUser?: UserProfile | null;
}

export const PayUserModal = ({
  open,
  onOpenChange,
  currentUserId,
  availableBalance,
  onSuccess,
  preselectedUser,
}: PayUserModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(preselectedUser || null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  // Set preselected user when modal opens
  useEffect(() => {
    if (open && preselectedUser) {
      setSelectedUser(preselectedUser);
    }
  }, [open, preselectedUser]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, username, display_name, avatar_url")
        .neq("user_id", currentUserId)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendPayment = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amountNum > availableBalance) {
      toast.error("Insufficient available balance");
      return;
    }

    setSending(true);
    try {
      // Create deduction transaction for sender
      const { error: deductError } = await supabase
        .from("balance_transactions")
        .insert({
          user_id: currentUserId,
          amount: -amountNum,
          type: "transfer_out",
          status: "completed",
          notes: `Transfer to @${selectedUser.username || selectedUser.display_name}${note ? `: ${note}` : ""}`,
        });

      if (deductError) throw deductError;

      // Create credit transaction for receiver
      const { error: creditError } = await supabase
        .from("balance_transactions")
        .insert({
          user_id: selectedUser.user_id,
          amount: amountNum,
          type: "transfer_in",
          status: "completed",
          notes: `Transfer received${note ? `: ${note}` : ""}`,
        });

      if (creditError) throw creditError;

      // Create notification for receiver
      await supabase.from("notifications").insert({
        user_id: selectedUser.user_id,
        title: "Payment Received!",
        message: `You received ₹${amountNum.toLocaleString()} from a user${note ? ` - "${note}"` : ""}`,
        type: "payment",
      });

      toast.success(`₹${amountNum.toLocaleString()} sent to @${selectedUser.username || selectedUser.display_name}!`);
      onOpenChange(false);
      setSelectedUser(null);
      setAmount("");
      setNote("");
      setSearchQuery("");
      onSuccess();
    } catch (error) {
      console.error("Error sending payment:", error);
      toast.error("Failed to send payment");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Send Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Available Balance */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-xl font-bold text-primary">₹{availableBalance.toLocaleString()}</p>
          </div>

          {!selectedUser ? (
            <>
              {/* Search Users */}
              <div className="space-y-2">
                <Label>Search User</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username or name..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Search Results */}
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border hover:bg-muted transition-colors text-left"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.display_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.display_name || "User"}</p>
                        <p className="text-sm text-muted-foreground truncate">@{user.username || "user"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No users found</p>
                </div>
              ) : null}
            </>
          ) : (
            <>
              {/* Selected User */}
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedUser.display_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedUser.display_name || "User"}</p>
                  <p className="text-sm text-muted-foreground truncate">@{selectedUser.username || "user"}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  Change
                </Button>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  max={availableBalance}
                />
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendPayment}
                disabled={sending || !amount || parseFloat(amount) <= 0}
                className="w-full"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send ₹{amount ? parseFloat(amount).toLocaleString() : "0"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayUserModal;
