import { useState, useEffect } from "react";
import { Plus, Check, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SavedAccount {
  email: string;
  avatar_url: string | null;
  display_name: string | null;
}

interface AccountSwitcherProps {
  currentEmail: string;
  currentAvatar: string | null;
  currentDisplayName: string | null;
  onLogout: () => void;
}

const ACCOUNTS_STORAGE_KEY = "zyrozo_saved_accounts";

export const AccountSwitcher = ({
  currentEmail,
  currentAvatar,
  currentDisplayName,
  onLogout,
}: AccountSwitcherProps) => {
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    // Load saved accounts from localStorage
    const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (stored) {
      try {
        const accounts = JSON.parse(stored) as SavedAccount[];
        setSavedAccounts(accounts);
      } catch (e) {
        console.error("Error parsing saved accounts:", e);
      }
    }

    // Save current account
    if (currentEmail) {
      saveCurrentAccount();
    }
  }, [currentEmail, currentAvatar, currentDisplayName]);

  const saveCurrentAccount = () => {
    const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    let accounts: SavedAccount[] = [];
    if (stored) {
      try {
        accounts = JSON.parse(stored);
      } catch (e) {
        accounts = [];
      }
    }

    // Check if account already exists
    const existingIndex = accounts.findIndex((a) => a.email === currentEmail);
    const newAccount: SavedAccount = {
      email: currentEmail,
      avatar_url: currentAvatar,
      display_name: currentDisplayName,
    };

    if (existingIndex >= 0) {
      accounts[existingIndex] = newAccount;
    } else {
      accounts.push(newAccount);
    }

    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    setSavedAccounts(accounts);
  };

  const handleSwitchAccount = async (account: SavedAccount) => {
    if (account.email === currentEmail) return;

    // First sign out, then prompt for login
    setSwitching(true);
    try {
      await supabase.auth.signOut();
      // Redirect to auth page with prefilled email
      window.location.href = `/auth?email=${encodeURIComponent(account.email)}`;
    } catch (error) {
      console.error("Error switching account:", error);
      toast.error("Failed to switch account");
    } finally {
      setSwitching(false);
    }
  };

  const handleAddNewAccount = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setSwitching(true);
    try {
      // Sign out current user first
      await supabase.auth.signOut();
      
      // Try to sign in with new credentials
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Switched to new account!");
      setShowAddAccount(false);
      setEmail("");
      setPassword("");
      window.location.reload();
    } catch (error) {
      console.error("Error adding account:", error);
      toast.error("Failed to add account");
    } finally {
      setSwitching(false);
    }
  };

  const handleRemoveAccount = (accountEmail: string) => {
    if (accountEmail === currentEmail) {
      toast.error("Cannot remove current account");
      return;
    }

    const updated = savedAccounts.filter((a) => a.email !== accountEmail);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
    setSavedAccounts(updated);
    toast.success("Account removed");
  };

  return (
    <div className="space-y-4">
      {/* Current Account */}
      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
        <Avatar className="w-10 h-10">
          <AvatarImage src={currentAvatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {currentDisplayName?.charAt(0)?.toUpperCase() || currentEmail?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{currentDisplayName || "User"}</p>
          <p className="text-sm text-muted-foreground truncate">{currentEmail}</p>
        </div>
        <Check className="w-5 h-5 text-primary" />
      </div>

      {/* Other Saved Accounts */}
      {savedAccounts
        .filter((a) => a.email !== currentEmail)
        .map((account) => (
          <div
            key={account.email}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border hover:bg-muted transition-colors cursor-pointer group"
            onClick={() => handleSwitchAccount(account)}
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={account.avatar_url || undefined} />
              <AvatarFallback className="bg-muted">
                {account.display_name?.charAt(0)?.toUpperCase() || account.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{account.display_name || "User"}</p>
              <p className="text-sm text-muted-foreground truncate">{account.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveAccount(account.email);
              }}
            >
              Remove
            </Button>
          </div>
        ))}

      {/* Add Account */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogTrigger asChild>
          <button className="w-full flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-dashed border-border hover:bg-muted/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="font-medium">Add Another Account</span>
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <Button
              onClick={handleAddNewAccount}
              disabled={switching}
              className="w-full"
            >
              {switching ? "Signing in..." : "Sign In & Switch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Button */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={onLogout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Log Out
      </Button>
    </div>
  );
};

export default AccountSwitcher;
