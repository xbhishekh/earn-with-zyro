import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender_type: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface SupportChat {
  id: string;
  status: string;
  unread_count: number;
}

interface SupportChatWidgetProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

const SupportChatWidget = ({ forceOpen = false, onClose }: SupportChatWidgetProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<SupportChat | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync isOpen with forceOpen prop
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    if (!user) return;
    fetchOrCreateChat();
    fetchWelcomeMessage();
  }, [user]);

  useEffect(() => {
    if (!chat) return;

    // Real-time subscription for messages
    const channel = supabase
      .channel(`support-messages-${chat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat, isOpen]);

  useEffect(() => {
    if (isOpen && chat) {
      markMessagesAsRead();
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, chat]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchWelcomeMessage = async () => {
    try {
      const { data } = await supabase
        .from("support_config")
        .select("welcome_message")
        .limit(1)
        .maybeSingle();
      if (data?.welcome_message) {
        setWelcomeMessage(data.welcome_message);
      }
    } catch (error) {
      console.error("Error fetching welcome message:", error);
    }
  };

  const fetchOrCreateChat = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Check for existing chat
      const { data: existingChat } = await supabase
        .from("support_chats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingChat) {
        setChat(existingChat);
        await fetchMessages(existingChat.id);
      } else {
        // Create new chat
        const { data: newChat, error } = await supabase
          .from("support_chats")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        setChat(newChat);
      }
    } catch (error) {
      console.error("Error fetching/creating chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const markMessagesAsRead = async () => {
    if (!chat || !user) return;

    await supabase
      .from("support_messages")
      .update({ is_read: true })
      .eq("chat_id", chat.id)
      .eq("sender_type", "admin")
      .eq("is_read", false);

    await supabase
      .from("support_chats")
      .update({ unread_count: 0 })
      .eq("id", chat.id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat || !user || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const { error } = await supabase.from("support_messages").insert({
        chat_id: chat.id,
        sender_id: user.id,
        sender_type: "user",
        content: messageContent,
      });

      if (error) throw error;

      // Update chat last message
      await supabase
        .from("support_chats")
        .update({
          last_message_preview: messageContent.substring(0, 100),
          last_message_at: new Date().toISOString(),
          admin_unread_count: (chat as any).admin_unread_count + 1 || 1,
        })
        .eq("id", chat.id);

    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="gradient-bg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-white/20">
                <AvatarFallback className="bg-white/20 text-white">Z</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-white">Cliperus Support</h3>
                <p className="text-xs text-white/70">We typically reply within minutes</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h4 className="font-medium mb-1">Start a conversation</h4>
                <p className="text-sm text-muted-foreground px-4">
                  {welcomeMessage || "Send us a message and we'll get back to you soon!"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.sender_type === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {format(new Date(message.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t bg-muted/30">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SupportChatWidget;