import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminSupport = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Placeholder data
  const chats = [
    { id: "1", username: "creator1", lastMessage: "Need help with payout", unread: 2, status: "open" },
    { id: "2", username: "creator2", lastMessage: "Thanks for the help!", unread: 0, status: "closed" },
  ];

  const messages = [
    { id: "1", sender: "user", content: "Hi, I need help with my payout", time: "10:30 AM" },
    { id: "2", sender: "admin", content: "Sure, what's the issue?", time: "10:32 AM" },
  ];

  const handleSend = () => {
    if (!message.trim()) return;
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold mb-1">Support Chats</h1><p className="text-muted-foreground">Real-time support with creators</p></div>

      <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground"><strong>Note:</strong> Support tables need to be created. Placeholder UI shown.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border"><h3 className="font-medium">Active Chats</h3></div>
          <ScrollArea className="h-[400px]">
            {chats.map(chat => (
              <button key={chat.id} onClick={() => setSelectedChat(chat.id)} className={`w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors ${selectedChat === chat.id ? "bg-muted/50" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">@{chat.username}</span>
                  {chat.unread > 0 && <Badge className="bg-primary text-white">{chat.unread}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
              </button>
            ))}
          </ScrollArea>
        </motion.div>

        {/* Chat Window */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden lg:col-span-2">
          {selectedChat ? (
            <div className="flex flex-col h-[500px]">
              <div className="p-4 border-b border-border"><h3 className="font-medium">@creator1</h3></div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] p-3 rounded-xl ${msg.sender === "admin" ? "bg-primary text-white" : "bg-muted"}`}>
                        <p>{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-border flex gap-2">
                <Input placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
                <Button onClick={handleSend}><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a chat to start</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSupport;
