import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Edit,
  Loader2,
  Send,
  ArrowLeft,
  MoreHorizontal,
  Trash2,
  CheckCheck,
  Check,
  Paperclip,
  X,
  Download,
  FileText,
  BadgeCheck,
  Plus,
  Smile,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verified?: boolean | null;
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
  room_id: string;
  created_at: string;
  read_at: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
}

const ALLOWED_FILE_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TEAM_ZYROZO_USER_ID = "00000000-0000-0000-0000-000000000001";

const Messages = () => {
  const { user, loading: authLoading, isAdmin, isSuperAdmin, isOwner, isFounder } = useAuth();
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
  const [filter, setFilter] = useState<"unread" | "requests">("unread");
  const [hoveredConvo, setHoveredConvo] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const canDeleteBroadcasts = isAdmin || isSuperAdmin || isOwner || isFounder;

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    
    const channel = supabase
      .channel("dm-messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            const { data: participant } = await supabase
              .from("dm_participants")
              .select("room_id")
              .eq("room_id", newMsg.room_id)
              .eq("user_id", user.id)
              .maybeSingle();
            
            if (participant) {
              fetchConversations();
              if (selectedConversation && newMsg.room_id === selectedConversation.room_id) {
                setMessages(prev => {
                  if (prev.some(m => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });
                scrollToBottom();
                if (newMsg.user_id !== user.id) {
                  markMessagesAsRead(selectedConversation.room_id);
                }
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as Message;
            setMessages(prev => prev.map(m => 
              m.id === updatedMsg.id ? { ...m, read_at: updatedMsg.read_at } : m
            ));
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setMessages(prev => prev.filter(m => m.id !== deletedId));
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.room_id);
      
      // Set up typing indicator presence channel
      const channelName = `typing:${selectedConversation.room_id}`;
      
      // Cleanup previous channel if exists
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
      
      const channel = supabase.channel(channelName)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const otherUserId = selectedConversation.other_user.user_id;
          
          // Check if other user is typing
          let isTyping = false;
          for (const key in state) {
            const presences = state[key] as unknown as { user_id: string; typing: boolean }[];
            if (presences.some((p) => p.user_id === otherUserId && p.typing)) {
              isTyping = true;
              break;
            }
          }
          setIsOtherUserTyping(isTyping);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ user_id: user?.id, typing: false });
          }
        });
      
      presenceChannelRef.current = channel;
      
      return () => {
        if (presenceChannelRef.current) {
          supabase.removeChannel(presenceChannelRef.current);
          presenceChannelRef.current = null;
        }
      };
    }
  }, [selectedConversation, user?.id]);

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

  const markMessagesAsRead = async (roomId: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase
      .from("chat_messages")
      .update({ read_at: now })
      .eq("room_id", roomId)
      .neq("user_id", user.id)
      .is("read_at", null);
    
    setMessages(prev => prev.map(m => 
      m.user_id !== user.id && !m.read_at ? { ...m, read_at: now } : m
    ));
    setConversations(prev => prev.map(c => 
      c.room_id === roomId ? { ...c, unread_count: 0 } : c
    ));
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
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
      const { data: allParticipants, error: participantsError } = await supabase
        .from("dm_participants")
        .select("room_id, user_id")
        .in("room_id", roomIds)
        .neq("user_id", user.id);

      if (participantsError) throw participantsError;

      const otherUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      if (otherUserIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, is_verified")
        .in("user_id", otherUserIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map<string, Profile>();
      profiles?.forEach(p => profileMap.set(p.user_id, p));
      
      if (!profileMap.has(TEAM_ZYROZO_USER_ID) && otherUserIds.includes(TEAM_ZYROZO_USER_ID)) {
        profileMap.set(TEAM_ZYROZO_USER_ID, {
          user_id: TEAM_ZYROZO_USER_ID,
          username: "zyrozo_team",
          display_name: "Team Zyrozo",
          avatar_url: "/favicon.jpeg",
          is_verified: true,
        });
      }

      const conversationsData: Conversation[] = [];

      for (const room of dmRooms) {
        const otherParticipant = allParticipants?.find(p => p.room_id === room.room_id);
        if (!otherParticipant) continue;
        const profile = profileMap.get(otherParticipant.user_id);
        if (!profile) continue;

        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("content, created_at, user_id, attachment_type")
          .eq("room_id", room.room_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: unreadCount } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("room_id", room.room_id)
          .neq("user_id", user.id)
          .is("read_at", null);

        let lastMessagePreview = lastMsg?.content || "";
        if (lastMsg?.attachment_type) {
          lastMessagePreview = lastMsg.attachment_type.startsWith("image/") ? "📷 Photo" : "📎 File";
        }
        if (lastMessagePreview.length > 40) {
          lastMessagePreview = lastMessagePreview.substring(0, 40) + "...";
        }

        conversationsData.push({
          room_id: room.room_id,
          other_user: profile,
          last_message: lastMessagePreview,
          last_message_at: lastMsg?.created_at,
          unread_count: unreadCount || 0,
        });
      }

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
        .select("id, content, user_id, room_id, created_at, read_at, attachment_url, attachment_type, attachment_name")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
      markMessagesAsRead(roomId);
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
        .select("user_id, username, display_name, avatar_url, is_verified")
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
      setShowUserSearch(false);
      setUserSearchQuery("");
      setSearchResults([]);

      const existingConvo = conversations.find(c => c.other_user.user_id === otherUser.user_id);
      if (existingConvo) {
        setSelectedConversation(existingConvo);
        return;
      }

      const { data: myRooms } = await supabase
        .from("dm_participants")
        .select("room_id")
        .eq("user_id", user.id);

      if (myRooms && myRooms.length > 0) {
        const roomIds = myRooms.map(r => r.room_id);
        const { data: existingParticipant } = await supabase
          .from("dm_participants")
          .select("room_id")
          .in("room_id", roomIds)
          .eq("user_id", otherUser.user_id)
          .maybeSingle();

        if (existingParticipant) {
          const newConvo: Conversation = {
            room_id: existingParticipant.room_id,
            other_user: otherUser,
            unread_count: 0,
          };
          setConversations(prev => {
            if (prev.some(c => c.room_id === newConvo.room_id)) return prev;
            return [newConvo, ...prev];
          });
          setSelectedConversation(newConvo);
          return;
        }
      }

      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({ type: "dm", name: null })
        .select()
        .single();

      if (roomError) throw roomError;

      await supabase.from("dm_participants").insert([
        { room_id: room.id, user_id: user.id },
        { room_id: room.id, user_id: otherUser.user_id },
      ]);

      const newConvo: Conversation = {
        room_id: room.id,
        other_user: otherUser,
        unread_count: 0,
      };

      setConversations(prev => [newConvo, ...prev]);
      setSelectedConversation(newConvo);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("File type not allowed");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 10MB");
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (): Promise<{ url: string; type: string; name: string } | null> => {
    if (!selectedFile || !user) return null;
    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, selectedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("chat-attachments").getPublicUrl(fileName);
      return { url: publicUrl, type: selectedFile.type, name: selectedFile.name };
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const broadcastTyping = useCallback(async (typing: boolean) => {
    if (!presenceChannelRef.current || !user) return;
    await presenceChannelRef.current.track({ user_id: user.id, typing });
  }, [user]);

  const handleTyping = useCallback(() => {
    broadcastTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 2000);
  }, [broadcastTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !user || sending) return;
    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");
    
    // Stop typing indicator when sending
    broadcastTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      let attachment = null;
      if (selectedFile) {
        attachment = await uploadFile();
        clearSelectedFile();
      }

      const { error } = await supabase.from("chat_messages").insert({
        room_id: selectedConversation.room_id,
        user_id: user.id,
        content: messageContent || "",
        attachment_url: attachment?.url,
        attachment_type: attachment?.type,
        attachment_name: attachment?.name,
      });

      if (error) throw error;
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string, isSystemMessage: boolean = false) => {
    try {
      if (isSystemMessage && canDeleteBroadcasts) {
        // Admin deleting broadcast - delete for everyone
        const { error } = await supabase.from("chat_messages").delete().eq("id", messageId);
        if (error) throw error;
      } else {
        // Regular user deleting own message
        const { error } = await supabase
          .from("chat_messages")
          .delete()
          .eq("id", messageId)
          .eq("user_id", user?.id);
        if (error) throw error;
      }
      
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message deleted");
      fetchConversations();
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const formatConvoTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return format(date, "h:mm a");
    if (diffDays < 7) return format(date, "EEE");
    return format(date, "M/d");
  };

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return "TODAY";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "YESTERDAY";
    return format(date, "EEEE h:mm a").toUpperCase();
  };

  const renderAttachment = (message: Message) => {
    if (!message.attachment_url) return null;
    const isImage = message.attachment_type?.startsWith("image/");
    if (isImage) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden max-w-[200px]">
          <img
            src={message.attachment_url}
            alt="Attachment"
            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.attachment_url!, "_blank")}
          />
        </div>
      );
    }
    return (
      <a
        href={message.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
      >
        <FileText className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm truncate flex-1">{message.attachment_name || "File"}</span>
        <Download className="w-4 h-4 text-muted-foreground" />
      </a>
    );
  };

  const filteredConversations = conversations.filter(convo => {
    const matchesSearch = searchQuery
      ? (convo.other_user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         convo.other_user.username?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    if (filter === "unread") return matchesSearch && convo.unread_count > 0;
    return matchesSearch;
  });

  const allConversations = conversations.filter(convo => {
    return searchQuery
      ? (convo.other_user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         convo.other_user.username?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
  });

  const groupedMessages = messages.reduce((groups: { date: string; messages: Message[] }[], message) => {
    const date = new Date(message.created_at).toDateString();
    const existingGroup = groups.find(g => g.date === date);
    if (existingGroup) {
      existingGroup.messages.push(message);
    } else {
      groups.push({ date, messages: [message] });
    }
    return groups;
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isTeamZyrozo = selectedConversation?.other_user?.user_id === TEAM_ZYROZO_USER_ID;

  return (
    <MainLayout showMobileNav={false}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={ALLOWED_FILE_TYPES.join(",")}
        className="hidden"
      />

      {/* Left Sidebar - Conversations - Always visible on desktop */}
      <div className={cn(
        "w-full md:w-[340px] lg:w-[380px] border-r border-border flex flex-col bg-background shrink-0 h-full",
        selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 bg-muted/50 border-0 h-10 rounded-lg"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserSearch(true)}
              className="shrink-0 h-10 w-10"
            >
              <Edit className="w-5 h-5" />
            </Button>
          </div>

          {/* Filter Tabs - Whop style */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
                filter === "unread"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-foreground border-border hover:bg-muted"
              )}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter("requests")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5",
                filter === "requests"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-foreground border-border hover:bg-muted"
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
          ) : allConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click the edit icon to start a new chat
              </p>
            </div>
          ) : (
            <div>
              {allConversations.map((convo) => {
                const isTeamZyrozo = convo.other_user.user_id === TEAM_ZYROZO_USER_ID;
                const isSelected = selectedConversation?.room_id === convo.room_id;
                
                return (
                  <div
                    key={convo.room_id}
                    className="relative"
                    onMouseEnter={() => setHoveredConvo(convo.room_id)}
                    onMouseLeave={() => setHoveredConvo(null)}
                  >
                    <button
                      onClick={() => setSelectedConversation(convo)}
                      className={cn(
                        "w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left",
                        isSelected && "bg-muted"
                      )}
                    >
                      <Avatar className="w-12 h-12 shrink-0">
                        <AvatarImage src={convo.other_user.avatar_url || undefined} />
                        <AvatarFallback className={cn(
                          "text-white font-medium",
                          isTeamZyrozo ? "bg-primary" : "bg-gradient-to-br from-gray-400 to-gray-600"
                        )}>
                          {(convo.other_user.display_name || convo.other_user.username || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className={cn(
                              "truncate text-sm",
                              convo.unread_count > 0 ? "font-bold" : "font-medium"
                            )}>
                              {convo.other_user.display_name || convo.other_user.username}
                            </span>
                            {(isTeamZyrozo || convo.other_user.is_verified) && (
                              <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </div>
                          {convo.last_message_at && (
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {formatConvoTime(convo.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          "text-sm truncate",
                          convo.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {convo.last_message || "Start a conversation"}
                        </p>
                      </div>
                    </button>

                    {/* Hover menu */}
                    {hoveredConvo === convo.room_id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-background shadow-sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-background min-w-0",
        !selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header - Whop style */}
            <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-background shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedConversation.other_user.avatar_url || undefined} />
                  <AvatarFallback className={cn(
                    "text-white text-sm",
                    isTeamZyrozo ? "bg-primary" : "bg-gradient-to-br from-gray-400 to-gray-600"
                  )}>
                    {(selectedConversation.other_user.display_name || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm">
                    {selectedConversation.other_user.display_name || selectedConversation.other_user.username}
                  </span>
                  {(isTeamZyrozo || selectedConversation.other_user.is_verified) && (
                    <BadgeCheck className="w-4 h-4 text-primary" />
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1">
              <div className="p-4 min-h-full">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm">
                        Start the conversation by sending a message
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedMessages.map((group) => (
                      <div key={group.date}>
                        {/* Date Separator - Whop style */}
                        <div className="flex items-center justify-center my-6">
                          <span className="text-xs text-muted-foreground font-medium tracking-wide">
                            {formatDateSeparator(group.messages[0].created_at)}
                          </span>
                        </div>

                        {/* Messages */}
                        {group.messages.map((message, index) => {
                          const isOwn = message.user_id === user?.id;
                          const isSysMsg = message.user_id === TEAM_ZYROZO_USER_ID;
                          const showAvatar = !isOwn && (
                            index === 0 || group.messages[index - 1]?.user_id !== message.user_id
                          );
                          const showName = showAvatar && !isOwn;
                          const isLastInGroup = index === group.messages.length - 1 || 
                            group.messages[index + 1]?.user_id !== message.user_id;

                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "flex gap-2 group mb-1",
                                isOwn ? "justify-end" : "justify-start"
                              )}
                            >
                              {/* Avatar for received messages */}
                              {!isOwn && (
                                <div className="w-8 shrink-0">
                                  {showAvatar && (
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={selectedConversation.other_user.avatar_url || undefined} />
                                      <AvatarFallback className={cn(
                                        "text-white text-xs",
                                        isSysMsg ? "bg-primary" : "bg-gradient-to-br from-gray-400 to-gray-600"
                                      )}>
                                        {(selectedConversation.other_user.display_name || "?").charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              )}

                              <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
                                {/* Name + timestamp for received */}
                                {showName && (
                                  <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                      {selectedConversation.other_user.display_name || selectedConversation.other_user.username}
                                    </span>
                                    <span>•</span>
                                    <span>{format(new Date(message.created_at), "MMM d, yyyy h:mm a")}</span>
                                  </div>
                                )}

                                {/* Message Bubble */}
                                <div className={cn(
                                  "px-4 py-2 relative group",
                                  isOwn 
                                    ? "bg-[#5865F2] text-white rounded-2xl rounded-br-sm" 
                                    : isSysMsg && message.content?.includes("paid")
                                      ? "bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 rounded-2xl rounded-bl-sm"
                                      : "bg-muted rounded-2xl rounded-bl-sm"
                                )}>
                                  {message.content && (
                                    isSysMsg && message.content.includes("paid") ? (
                                      <p className="text-sm">
                                        {message.content.split(/(@\w+)/g).map((part, idx) => {
                                          if (part.startsWith("@")) {
                                            return (
                                              <span key={idx} className="bg-primary text-white px-1.5 py-0.5 rounded font-medium">
                                                {part}
                                              </span>
                                            );
                                          } else if (part.includes("$")) {
                                            const dollarMatch = part.match(/(\$[\d.]+)/);
                                            if (dollarMatch) {
                                              const [beforeDollar, afterDollar] = part.split(dollarMatch[0]);
                                              return (
                                                <span key={idx}>
                                                  {beforeDollar}
                                                  <span className="text-green-600 font-semibold">{dollarMatch[0]}</span>
                                                  {afterDollar}
                                                </span>
                                              );
                                            }
                                          }
                                          return <span key={idx}>{part}</span>;
                                        })}
                                        <span className="ml-1">💸</span>
                                      </p>
                                    ) : (
                                      <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.content}
                                      </p>
                                    )
                                  )}
                                  {renderAttachment(message)}
                                  
                                  {/* Delete button */}
                                  {(isOwn || (isSysMsg && canDeleteBroadcasts)) && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          className={cn(
                                            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10",
                                            isOwn ? "-left-8" : "-right-8"
                                          )}
                                        >
                                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align={isOwn ? "end" : "start"}>
                                        <DropdownMenuItem
                                          onClick={() => deleteMessage(message.id, isSysMsg)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          {isSysMsg ? "Delete for everyone" : "Delete"}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>

                                {/* Read receipt for own messages */}
                                {isOwn && isLastInGroup && (
                                  <div className="flex items-center gap-1 mt-0.5 px-1">
                                    {message.read_at ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-primary" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-muted-foreground" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Bottom Section */}
            {isTeamZyrozo ? (
              <div className="px-4 py-3 border-t border-border bg-background shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">This is the official Zyrozo notification channel</p>
                    <p className="text-xs text-muted-foreground">Zyrozo will always use verified accounts to communicate with you</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Typing Indicator */}
                {isOtherUserTyping && (
                  <div className="px-4 py-2 border-t border-border bg-background shrink-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={selectedConversation.other_user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-gray-400 to-gray-600 text-white">
                          {(selectedConversation.other_user.display_name || "?").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {selectedConversation.other_user.display_name || selectedConversation.other_user.username}
                      </span>
                      <span>is typing</span>
                      <span className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )}

                {/* File Preview */}
                {selectedFile && (
                  <div className="px-4 py-2 border-t border-border bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-background">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-14 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={clearSelectedFile} className="shrink-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Message Input - Whop style */}
                <div className="p-3 border-t border-border bg-background shrink-0">
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex items-center gap-2"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || uploading}
                      className="shrink-0 h-9 w-9 rounded-full"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                    
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder={`Message @${selectedConversation.other_user.username || "user"}`}
                        className="pr-20 bg-muted/50 border-0 h-10 rounded-full"
                        disabled={sending || uploading}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                          <Smile className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>

                    {(newMessage.trim() || selectedFile) && (
                      <Button
                        type="submit"
                        size="icon"
                        disabled={sending || uploading}
                        className="shrink-0 h-9 w-9 rounded-full"
                      >
                        {sending || uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </form>
                </div>
              </>
            )}
          </>
        ) : (
          /* Empty State - No conversation selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Your Messages</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Send private messages to other users
              </p>
              <Button onClick={() => setShowUserSearch(true)} className="rounded-full">
                Start a Conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search by username or name..."
                className="pl-9"
                autoFocus
              />
            </div>
            
            <ScrollArea className="max-h-[300px]">
              {searchingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((profile) => (
                    <button
                      key={profile.user_id}
                      onClick={() => startConversation(profile)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white">
                          {(profile.display_name || profile.username || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium truncate">
                            {profile.display_name || profile.username}
                          </span>
                          {profile.is_verified && (
                            <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          @{profile.username}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : userSearchQuery ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Start typing to search for users
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Messages;
