import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface SupportChat {
  id: string;
  user_id: string;
  status: string;
  priority: string;
  last_message_preview: string | null;
  admin_unread_count: number;
  created_at: string;
}

interface SupportMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
}

const AdminSupport = () => {
  const { user } = useAuth();
  const { hasFullAccess, myCampaignMemberUserIds, loading: accessLoading } = useAdminAccess();
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!accessLoading) fetchChats();
  }, [accessLoading, hasFullAccess, myCampaignMemberUserIds]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      
      const channel = supabase
        .channel(`support-${selectedChat}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `chat_id=eq.${selectedChat}`,
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as SupportMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      let chatsQuery = supabase.from("support_chats").select("*").order("last_message_at", { ascending: false });
      
      // Filter for normal admin - only show chats from campaign members
      if (!hasFullAccess && myCampaignMemberUserIds.length > 0) {
        chatsQuery = chatsQuery.in("user_id", myCampaignMemberUserIds);
      } else if (!hasFullAccess && myCampaignMemberUserIds.length === 0) {
        setChats([]);
        setProfiles([]);
        setLoading(false);
        return;
      }

      const [chatsRes, profilesRes] = await Promise.all([
        chatsQuery,
        supabase.from("profiles").select("user_id, username, display_name"),
      ]);

      if (chatsRes.error) throw chatsRes.error;
      setChats(chatsRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("chat_id", chatId)
        .eq("sender_type", "user");

      await supabase
        .from("support_chats")
        .update({ admin_unread_count: 0 })
        .eq("id", chatId);

    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedChat || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        chat_id: selectedChat,
        sender_id: user.id,
        sender_type: "admin",
        content: message,
      });

      if (error) throw error;

      await supabase.from("support_chats").update({
        last_message_at: new Date().toISOString(),
        last_message_preview: message.slice(0, 100),
        unread_count: 1,
      }).eq("id", selectedChat);

      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getUsername = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.username || profile?.display_name || userId.slice(0, 8);
  };

  const handleCloseChat = async (chatId: string) => {
    try {
      await supabase.from("support_chats").update({ status: "closed" }).eq("id", chatId);
      toast.success("Chat closed");
      fetchChats();
    } catch (error) {
      toast.error("Failed to close chat");
    }
  };

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasFullAccess && myCampaignMemberUserIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-bold mb-2">No Campaign Members</h3>
        <p className="text-muted-foreground">Create a campaign and get members to see support chats here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Support Chats</h1>
          <p className="text-muted-foreground">
            {hasFullAccess ? "Real-time support with all creators" : "Support for your campaign members"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchChats}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium">Active Chats ({chats.filter(c => c.status === "open").length})</h3>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No support chats yet
              </div>
            ) : (
              chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors ${
                    selectedChat === chat.id ? "bg-muted/50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">@{getUsername(chat.user_id)}</span>
                    <div className="flex items-center gap-2">
                      {chat.admin_unread_count > 0 && (
                        <Badge className="bg-primary text-white">{chat.admin_unread_count}</Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={chat.status === "open" ? "text-success border-success" : "text-muted-foreground"}
                      >
                        {chat.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.last_message_preview || "No messages yet"}
                  </p>
                </button>
              ))
            )}
          </ScrollArea>
        </motion.div>

        {/* Chat Window */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden lg:col-span-2 flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-medium">
                  @{getUsername(chats.find(c => c.id === selectedChat)?.user_id || "")}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCloseChat(selectedChat)}
                >
                  Close Chat
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-xl ${
                          msg.sender_type === "admin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(new Date(msg.created_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-border flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  disabled={sending}
                />
                <Button onClick={handleSend} disabled={sending || !message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a chat to start responding</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSupport;
