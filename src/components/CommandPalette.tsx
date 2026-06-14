import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Megaphone,
  ShoppingBag,
  MessageSquare,
  Users,
  Wallet,
  User,
  LayoutDashboard,
  Shield,
  HelpCircle,
  Image,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ArrowUp,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "./ThemeProvider";

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to anywhere or type a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/")}>
            <Home className="w-4 h-4 mr-2" /> Home
          </CommandItem>
          <CommandItem onSelect={() => go("/campaigns")}>
            <Megaphone className="w-4 h-4 mr-2" /> Campaigns
          </CommandItem>
          <CommandItem onSelect={() => go("/marketplace")}>
            <ShoppingBag className="w-4 h-4 mr-2" /> Marketplace
          </CommandItem>
          <CommandItem onSelect={() => go("/gallery")}>
            <Image className="w-4 h-4 mr-2" /> Gallery
          </CommandItem>
          {user && (
            <>
              <CommandItem onSelect={() => go("/dashboard")}>
                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
              </CommandItem>
              <CommandItem onSelect={() => go("/messages")}>
                <MessageSquare className="w-4 h-4 mr-2" /> Messages
              </CommandItem>
              <CommandItem onSelect={() => go("/affiliate")}>
                <Users className="w-4 h-4 mr-2" /> Affiliate
              </CommandItem>
              <CommandItem onSelect={() => go("/balance")}>
                <Wallet className="w-4 h-4 mr-2" /> Balance
              </CommandItem>
              <CommandItem onSelect={() => go("/profile")}>
                <User className="w-4 h-4 mr-2" /> Profile
              </CommandItem>
              <CommandItem onSelect={() => go("/my-submissions")}>
                <Sparkles className="w-4 h-4 mr-2" /> My Submissions
              </CommandItem>
            </>
          )}
          <CommandItem onSelect={() => go("/support")}>
            <HelpCircle className="w-4 h-4 mr-2" /> Support
          </CommandItem>
          {isAdmin && (
            <CommandItem onSelect={() => go("/admin")}>
              <Shield className="w-4 h-4 mr-2" /> Admin Panel
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => { setTheme("light"); setOpen(false); }}>
            <Sun className="w-4 h-4 mr-2" /> Light mode
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("dark"); setOpen(false); }}>
            <Moon className="w-4 h-4 mr-2" /> Dark mode
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("system"); setOpen(false); }}>
            <Monitor className="w-4 h-4 mr-2" /> System theme
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <ArrowUp className="w-4 h-4 mr-2" /> Scroll to top
          </CommandItem>
          {user && (
            <CommandItem
              onSelect={async () => {
                setOpen(false);
                await signOut();
                navigate("/");
              }}
              className="text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
