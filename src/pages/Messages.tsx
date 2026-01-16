import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Edit,
  Loader2,
  Send,
  ArrowLeft,
  MoreVertical,
  Trash2,
  CheckCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  room_id: string;
  other_user: Profile;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  is_read?: boolean;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "requests">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    fetchConversations();
    
    // Real-time subscription for new messages
    const channel = supabase
      .channel("dm-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          // Refresh conversations when new message arrives
          fetchConversations();
          // If in active conversation, add message
          if (selectedConversation && payload.new.room_id === selectedConversation.room_id) {
            setMessages(prev => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.room_id);
    }
  }, [selectedConversation]);

  // Check for userId in URL to open chat
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId && user && conversations.length > 0) {
      const existingConvo = conversations.find(c => c.other_user.user_id === userId);
      if (existingConvo) {
        setSelectedConversation(existingConvo);
        setSearchParams({});
      }
    }
  }, [searchParams, user, conversations]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      // Get all DM rooms the user is part of
      const { data: dmRooms, error: roomsError } = await supabase
        .from("dm_participants")
        .select("room_id")
        .eq("user_id", user.id);

      if (roomsError) throw roomsError;
      if (!dmRooms || dmRooms.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const roomIds = dmRooms.map(r => r.room_id);

      // Get other participants for each room
      const { data: allParticipants, error: participantsError } = await supabase
        .from("dm_participants")
        .select("room_id, user_id")
        .in("room_id", roomIds)
        .neq("user_id", user.id);

      if (participantsError) throw participantsError;

      // Get profiles for other users
      const otherUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      
      if (otherUserIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", otherUserIds);

      if (profilesError) throw profilesError;

      // Get last message for each room
      const conversationsData: Conversation[] = [];

      for (const room of dmRooms) {
        const otherParticipant = allParticipants?.find(p => p.room_id === room.room_id);
        if (!otherParticipant) continue;

        const profile = profiles?.find(p => p.user_id === otherParticipant.user_id);
        if (!profile) continue;

        // Get last message
        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("content, created_at, user_id")
          .eq("room_id", room.room_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Count unread messages (simplified - messages from other user)
        const { count: unreadCount } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("room_id", room.room_id)
          .neq("user_id", user.id);

        conversationsData.push({
          room_id: room.room_id,
          other_user: profile,
          last_message: lastMsg?.content,
          last_message_at: lastMsg?.created_at,
          unread_count: 0, // Can enhance with read receipts later
        });
      }

      // Sort by last message time
      conversationsData.sort((a, b) => {
        if (!a.last_message_at) return 1;
        if (!b.last_message_at) return -1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      setConversations(conversationsData);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, content, user_id, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq("user_id", user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const startConversation = async (otherUser: Profile) => {
    if (!user) return;

    try {
      // Check if conversation already exists
      const existingConvo = conversations.find(
        c => c.other_user.user_id === otherUser.user_id
      );

      if (existingConvo) {
        setSelectedConversation(existingConvo);
        setShowUserSearch(false);
        setUserSearchQuery("");
        setSearchResults([]);
        return;
      }

      // Create new DM room
      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({ type: "dm", name: null })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add both participants
      const { error: participantsError } = await supabase
        .from("dm_participants")
        .insert([
          { room_id: room.id, user_id: user.id },
          { room_id: room.id, user_id: otherUser.user_id },
        ]);

      if (participantsError) throw participantsError;

      const newConvo: Conversation = {
        room_id: room.id,
        other_user: otherUser,
        unread_count: 0,
      };

      setConversations(prev => [newConvo, ...prev]);
      setSelectedConversation(newConvo);
      setShowUserSearch(false);
      setUserSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          room_id: selectedConversation.room_id,
          user_id: user.id,
          content: messageContent,
        });

      if (error) throw error;
      
      // Refresh conversations to update last message
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId)
        .eq("user_id", user?.id);

      if (error) throw error;
      
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const filteredConversations = conversations.filter(convo => {
    const matchesSearch = searchQuery
      ? (convo.other_user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         convo.other_user.username?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    
    if (filter === "unread") return matchesSearch && convo.unread_count > 0;
    return matchesSearch;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Conversations List */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "w-full md:w-96 border-r border-border flex flex-col bg-background",
          selectedConversation ? "hidden md:flex" : "flex"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 bg-muted/50"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserSearch(true)}
              className="shrink-0"
            >
              <Edit className="w-5 h-5" />
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                filter === "all"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                filter === "unread"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Unread
            </button>
            <button
              onClick={() => setFilter("requests")}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                filter === "requests"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Requests
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click the edit icon to start a new chat
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((convo) => (
                <motion.button
                  key={convo.room_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedConversation(convo)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left",
                    selectedConversation?.room_id === convo.room_id && "bg-muted/50"
                  )}
                >
                  {convo.unread_count > 0 && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-4 -ml-1" />
                  )}
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={convo.other_user.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                      {(convo.other_user.display_name || convo.other_user.username || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-semibold truncate">
                        {convo.other_user.display_name || convo.other_user.username || "Unknown User"}
                      </h4>
                      {convo.last_message_at && (
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatTime(convo.last_message_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {convo.last_message || "Start a conversation"}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </ScrollArea>
      </motion.div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConversation.other_user.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {(selectedConversation.other_user.display_name || selectedConversation.other_user.username || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {selectedConversation.other_user.display_name || selectedConversation.other_user.username}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    @{selectedConversation.other_user.username || "user"}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={selectedConversation.other_user.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl">
                        {(selectedConversation.other_user.display_name || selectedConversation.other_user.username || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg mb-1">
                      {selectedConversation.other_user.display_name || selectedConversation.other_user.username}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Start a conversation
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwn = message.user_id === user.id;
                    const showTime = index === 0 || 
                      new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000;

                    return (
                      <div key={message.id}>
                        {showTime && (
                          <div className="text-center mb-4">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex items-end gap-2 group",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          {!isOwn && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={selectedConversation.other_user.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-muted">
                                {(selectedConversation.other_user.display_name || "?").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={cn(
                            "max-w-[70%] px-4 py-2 rounded-2xl relative",
                            isOwn 
                              ? "bg-primary text-primary-foreground rounded-br-sm" 
                              : "bg-muted rounded-bl-sm"
                          )}>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            {isOwn && (
                              <button
                                onClick={() => deleteMessage(message.id)}
                                className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                          {isOwn && (
                            <div className="w-8 flex items-center justify-center">
                              <CheckCheck className="w-4 h-4 text-primary" />
                            </div>
                          )}
                        </motion.div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-2"
              >
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
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Edit className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Your Messages</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Send private messages to other users
              </p>
              <Button onClick={() => setShowUserSearch(true)}>
                Start a Conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-20"
            onClick={() => setShowUserSearch(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-full max-w-md bg-background border border-border rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-lg mb-3">New Message</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder="Search users by username..."
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
              <ScrollArea className="max-h-80">
                {searchingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {userSearchQuery ? "No users found" : "Search for a user to start chatting"}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {searchResults.map((profile) => (
                      <button
                        key={profile.user_id}
                        onClick={() => startConversation(profile)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                            {(profile.display_name || profile.username || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">
                            {profile.display_name || profile.username || "Unknown"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            @{profile.username || "user"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
