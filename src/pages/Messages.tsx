import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  MoreVertical,
  Trash2,
  CheckCheck,
  Check,
  Paperclip,
  Image as ImageIcon,
  X,
  Download,
  FileText,
  BadgeCheck,
  Calendar,
  Users,
  MessageCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  created_at?: string;
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
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Team Zyrozo system account
const TEAM_ZYROZO_USER_ID = "00000000-0000-0000-0000-000000000001";

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
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<Profile | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    fetchConversations();
    
    // Real-time subscription for new messages
    const channel = supabase
      .channel("dm-messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            
            // Check if this message is in a DM room the user is part of
            const { data: participant } = await supabase
              .from("dm_participants")
              .select("room_id")
              .eq("room_id", newMsg.room_id)
              .eq("user_id", user.id)
              .single();
            
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
              } else if (newMsg.user_id !== user.id) {
                showMessageNotification(newMsg);
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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.room_id);
      fetchUserProfile(selectedConversation.other_user.user_id);
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

  const fetchUserProfile = async (userId: string) => {
    if (userId === TEAM_ZYROZO_USER_ID) {
      setSelectedUserProfile({
        user_id: TEAM_ZYROZO_USER_ID,
        username: "zyrozo_team",
        display_name: "Team Zyrozo",
        avatar_url: "/favicon.jpeg",
        bio: "Official Zyrozo notification channel",
        is_verified: true,
      });
      setSocialAccounts([]);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profile) {
      setSelectedUserProfile(profile);
    }

    // Fetch social accounts
    const { data: socials } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "verified");

    setSocialAccounts(socials || []);
  };

  const showMessageNotification = async (message: Message) => {
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", message.user_id)
      .single();
    
    const senderName = senderProfile?.display_name || senderProfile?.username || "Someone";
    
    toast.message(`New message from ${senderName}`, {
      description: message.content.length > 50 
        ? message.content.substring(0, 50) + "..." 
        : message.content,
      action: {
        label: "View",
        onClick: () => {
          const convo = conversations.find(c => c.other_user.user_id === message.user_id);
          if (convo) setSelectedConversation(convo);
        },
      },
    });
    
    await supabase.from("notifications").insert({
      user_id: user!.id,
      type: "dm_message",
      title: `New message from ${senderName}`,
      message: message.content.length > 100 
        ? message.content.substring(0, 100) + "..." 
        : message.content,
      metadata: { room_id: message.room_id, sender_id: message.user_id },
    });
  };

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
      m.user_id !== user.id && !m.read_at 
        ? { ...m, read_at: now } 
        : m
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
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", otherUserIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map<string, Profile>();
      profiles?.forEach(p => profileMap.set(p.user_id, p));
      
      if (!profileMap.has(TEAM_ZYROZO_USER_ID) && otherUserIds.includes(TEAM_ZYROZO_USER_ID)) {
        profileMap.set(TEAM_ZYROZO_USER_ID, {
          user_id: TEAM_ZYROZO_USER_ID,
          username: "zyrozo_team",
          display_name: "Team Zyrozo",
          avatar_url: "/favicon.jpeg"
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
          .single();

        const { count: unreadCount } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("room_id", room.room_id)
          .neq("user_id", user.id)
          .is("read_at", null);

        let lastMessagePreview = lastMsg?.content;
        if (lastMsg?.attachment_type) {
          if (lastMsg.attachment_type.startsWith("image/")) {
            lastMessagePreview = "📷 Photo";
          } else {
            lastMessagePreview = "📎 File";
          }
        }
        
        if (lastMessagePreview && lastMessagePreview.length > 50) {
          lastMessagePreview = lastMessagePreview.substring(0, 50) + "...";
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
        const aIsTeam = a.other_user.user_id === TEAM_ZYROZO_USER_ID;
        const bIsTeam = b.other_user.user_id === TEAM_ZYROZO_USER_ID;
        
        if (aIsTeam && a.unread_count > 0 && (!bIsTeam || b.unread_count === 0)) return -1;
        if (bIsTeam && b.unread_count > 0 && (!aIsTeam || a.unread_count === 0)) return 1;
        
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
        .select("user_id, username, display_name, avatar_url, bio, is_verified, created_at")
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

      const existingConvo = conversations.find(
        c => c.other_user.user_id === otherUser.user_id
      );

      if (existingConvo) {
        setSelectedConversation(existingConvo);
        toast.success(`Chat with ${otherUser.display_name || otherUser.username} opened`);
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
          toast.success(`Chat with ${otherUser.display_name || otherUser.username} opened`);
          return;
        }
      }

      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({ type: "dm", name: null })
        .select()
        .single();

      if (roomError) throw roomError;

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
      toast.success(`Started chat with ${otherUser.display_name || otherUser.username}`);
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

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        type: selectedFile.type,
        name: selectedFile.name,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !user || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      let attachment = null;
      if (selectedFile) {
        attachment = await uploadFile();
        clearSelectedFile();
      }

      const { error } = await supabase
        .from("chat_messages")
        .insert({
          room_id: selectedConversation.room_id,
          user_id: user.id,
          content: messageContent || (attachment ? "" : ""),
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

  const formatReadReceipt = (readAt: string) => {
    const date = new Date(readAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Read just now";
    if (diffMins < 60) return `Read ${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Read ${diffHours}h ago`;
    
    return `Read ${format(date, "MMM d, h:mm a")}`;
  };

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
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
        <span className="text-sm truncate flex-1">
          {message.attachment_name || "File"}
        </span>
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

  // Group messages by date
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
      <div className="min-h-screen flex items-center justify-center">
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

      {/* Sidebar - Conversations List */}
      <div
        className={cn(
          "w-full md:w-[360px] lg:w-[400px] border-r border-border flex flex-col bg-card shrink-0",
          selectedConversation ? "hidden md:flex" : "flex"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 bg-muted/50 border-0 h-10"
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

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                filter === "all"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                filter === "unread"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Unread
            </button>
            <button
              onClick={() => setFilter("requests")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                filter === "requests"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
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
              <p className="text-primary font-medium">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click the <span className="text-primary">edit icon</span> to start a new chat
              </p>
            </div>
          ) : (
            <div>
              {filteredConversations.map((convo) => {
                const isTeamZyrozo = convo.other_user.user_id === TEAM_ZYROZO_USER_ID;
                
                return (
                  <button
                    key={convo.room_id}
                    onClick={() => setSelectedConversation(convo)}
                    className={cn(
                      "w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50",
                      selectedConversation?.room_id === convo.room_id && "bg-muted",
                      isTeamZyrozo && "bg-gradient-to-r from-orange-50/50 to-purple-50/50 dark:from-orange-950/20 dark:to-purple-950/20"
                    )}
                  >
                    <div className="relative">
                      <Avatar className={cn(
                        "w-12 h-12 shrink-0",
                        isTeamZyrozo && "ring-2 ring-primary"
                      )}>
                        <AvatarImage src={convo.other_user.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-medium">
                          {(convo.other_user.display_name || convo.other_user.username || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {convo.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                          {convo.unread_count > 9 ? "9+" : convo.unread_count}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className={cn(
                            "truncate text-sm",
                            convo.unread_count > 0 ? "font-bold text-foreground" : "font-semibold"
                          )}>
                            {convo.other_user.display_name || convo.other_user.username || "Unknown User"}
                          </h4>
                          {isTeamZyrozo && (
                            <>
                              <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                              <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-orange-500 to-purple-500 text-white border-0 shrink-0">
                                System
                              </Badge>
                            </>
                          )}
                        </div>
                        {convo.last_message_at && (
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {formatTime(convo.last_message_at)}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm truncate",
                        convo.unread_count > 0 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {convo.last_message || "Start a conversation"}
                      </p>
                    </div>
                  </button>
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
            {/* Chat Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <button
                  onClick={() => setShowUserProfile(!showUserProfile)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <Avatar className={cn("w-10 h-10", isTeamZyrozo && "ring-2 ring-primary")}>
                    <AvatarImage src={selectedConversation.other_user.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                      {(selectedConversation.other_user.display_name || selectedConversation.other_user.username || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm">
                        {selectedConversation.other_user.display_name || selectedConversation.other_user.username}
                      </span>
                      {isTeamZyrozo && (
                        <>
                          <BadgeCheck className="w-4 h-4 text-primary" />
                          <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-orange-500 to-purple-500 text-white border-0">
                            System
                          </Badge>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{selectedConversation.other_user.username || "user"}
                    </p>
                  </div>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUserProfile(!showUserProfile)}
                  className="hidden lg:flex"
                >
                  <Search className="w-5 h-5" />
                </Button>
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
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex min-h-0">
              {/* Messages */}
              <ScrollArea className="flex-1">
                <div className="p-4 min-h-full">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full py-20">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-20">
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
                          Start the conversation by sending a message
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupedMessages.map((group, groupIndex) => (
                        <div key={group.date}>
                          {/* Date Separator */}
                          <div className="flex items-center justify-center my-6">
                            <div className="px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                              {formatDateSeparator(group.messages[0].created_at)}
                            </div>
                          </div>

                          {/* Messages */}
                          {group.messages.map((message, index) => {
                            const isOwn = message.user_id === user?.id;
                            const isTeamZyrozo = message.user_id === TEAM_ZYROZO_USER_ID;
                            const isLastOwn = isOwn && 
                              (index === group.messages.length - 1 || 
                               group.messages[index + 1]?.user_id !== user?.id);
                            const showAvatar = !isOwn && (
                              index === 0 || 
                              group.messages[index - 1]?.user_id !== message.user_id
                            );
                            const showTimestamp = index === group.messages.length - 1 || 
                              group.messages[index + 1]?.user_id !== message.user_id;

                            return (
                              <div
                                key={message.id}
                                className={cn(
                                  "flex gap-2 group",
                                  isOwn ? "justify-end" : "justify-start",
                                  !showTimestamp && "mb-0.5"
                                )}
                              >
                                {/* Avatar for other user */}
                                {!isOwn && (
                                  <div className="w-8 shrink-0">
                                    {showAvatar && (
                                      <Avatar className={cn("w-8 h-8", isTeamZyrozo && "ring-2 ring-primary")}>
                                        <AvatarImage src={selectedConversation.other_user.avatar_url || undefined} />
                                        <AvatarFallback className="text-xs bg-muted">
                                          {(selectedConversation.other_user.display_name || "?").charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                  </div>
                                )}

                                <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
                                  {/* Team Zyrozo label */}
                                  {isTeamZyrozo && showAvatar && (
                                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                                      <span className="text-xs font-semibold text-foreground">Team Zyrozo</span>
                                      <BadgeCheck className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                  )}

                                  {/* Message Bubble */}
                                  <div className={cn(
                                    "px-4 py-2.5 relative",
                                    isOwn 
                                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md" 
                                      : isTeamZyrozo && message.content?.includes("paid @")
                                        ? "bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 dark:from-pink-950/50 dark:via-purple-950/50 dark:to-blue-950/50 rounded-2xl rounded-bl-md"
                                        : isTeamZyrozo
                                          ? "bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl rounded-bl-md"
                                          : "bg-muted rounded-2xl rounded-bl-md"
                                  )}>
                                    {message.content && (
                                      isTeamZyrozo && message.content.includes("paid @") ? (
                                        <p className="text-sm font-medium">
                                          {message.content.split(/(@\w+)/g).map((part, idx) => {
                                            if (part.startsWith("@Zyrozo")) {
                                              return <span key={idx} className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-1.5 py-0.5 rounded font-semibold">{part}</span>;
                                            } else if (part.startsWith("@")) {
                                              return <span key={idx} className="bg-gradient-to-r from-purple-400 to-purple-500 text-white px-1.5 py-0.5 rounded font-semibold">{part}</span>;
                                            } else if (part.includes("$")) {
                                              const dollarMatch = part.match(/(\$[\d.]+)/);
                                              if (dollarMatch) {
                                                const beforeDollar = part.substring(0, part.indexOf(dollarMatch[0]));
                                                const afterDollar = part.substring(part.indexOf(dollarMatch[0]) + dollarMatch[0].length);
                                                return <span key={idx}>{beforeDollar}<span className="text-green-600 dark:text-green-400 font-bold">{dollarMatch[0]}</span>{afterDollar}</span>;
                                              }
                                            }
                                            return <span key={idx}>{part}</span>;
                                          })}
                                        </p>
                                      ) : (
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                          {message.content}
                                        </p>
                                      )
                                    )}
                                    {renderAttachment(message)}
                                    
                                    {/* Delete button for own messages */}
                                    {isOwn && (
                                      <button
                                        onClick={() => deleteMessage(message.id)}
                                        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Timestamp & Read receipt */}
                                  {showTimestamp && (
                                    <div className="flex items-center gap-1 mt-1 px-1">
                                      <span className="text-[10px] text-muted-foreground">
                                        {format(new Date(message.created_at), "h:mm a")}
                                      </span>
                                      {isOwn && isLastOwn && (
                                        <>
                                          {message.read_at ? (
                                            <CheckCheck className="w-3 h-3 text-primary" />
                                          ) : (
                                            <Check className="w-3 h-3 text-muted-foreground" />
                                          )}
                                        </>
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

              {/* User Profile Panel - Desktop */}
              <AnimatePresence>
                {showUserProfile && selectedUserProfile && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="hidden lg:block border-l border-border bg-card shrink-0 overflow-hidden"
                  >
                    <div className="w-[320px] h-full overflow-y-auto">
                      {/* Profile Header */}
                      <div className="relative">
                        <div className="h-24 bg-gradient-to-br from-muted to-muted/50" />
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                          <Avatar className={cn("w-20 h-20 border-4 border-card", isTeamZyrozo && "ring-2 ring-primary")}>
                            <AvatarImage src={selectedUserProfile.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl">
                              {(selectedUserProfile.display_name || selectedUserProfile.username || "?").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      <div className="pt-14 px-4 pb-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <h3 className="font-bold text-lg">
                            {selectedUserProfile.display_name || selectedUserProfile.username}
                          </h3>
                          {(isTeamZyrozo || selectedUserProfile.is_verified) && (
                            <BadgeCheck className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          @{selectedUserProfile.username}
                        </p>

                        {/* Social Accounts */}
                        {socialAccounts.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {socialAccounts.map((account) => (
                              <a
                                key={account.id}
                                href={account.profile_url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors"
                              >
                                <span className="capitalize">{account.platform}</span>
                                <span className="text-muted-foreground">@{account.username}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Profile Info */}
                        <div className="mt-4 space-y-2 text-sm">
                          {selectedUserProfile.created_at && (
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>Joined {format(new Date(selectedUserProfile.created_at), "MMM yyyy")}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!isTeamZyrozo && (
                          <div className="flex gap-2 mt-6">
                            <Button className="flex-1 rounded-full" asChild>
                              <Link to={`/u/${selectedUserProfile.username}`}>
                                View Profile
                              </Link>
                            </Button>
                          </div>
                        )}

                        {selectedUserProfile.bio && (
                          <p className="mt-4 text-sm text-muted-foreground">
                            {selectedUserProfile.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Message Input Area */}
            {isTeamZyrozo ? (
              <div className="px-4 py-4 border-t border-border bg-gradient-to-r from-orange-50 to-purple-50 dark:from-orange-950/30 dark:to-purple-950/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-primary flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">This is the official Zyrozo notification channel</p>
                    <p className="text-xs text-muted-foreground">Zyrozo will always use verified accounts to communicate with you</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* File Preview */}
                {selectedFile && (
                  <div className="px-4 py-2 border-t border-border bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-background">
                      {filePreview ? (
                        <img 
                          src={filePreview} 
                          alt="Preview" 
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearSelectedFile}
                        className="shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t border-border bg-card shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || uploading}
                      className="shrink-0"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = "image/*";
                          fileInputRef.current.click();
                          fileInputRef.current.accept = ALLOWED_FILE_TYPES.join(",");
                        }
                      }}
                      disabled={sending || uploading}
                      className="shrink-0"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message @${selectedConversation.other_user.username || "user"}...`}
                        className="bg-muted border-0 pr-12"
                        disabled={sending || uploading}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
                      className="shrink-0 rounded-full bg-primary hover:bg-primary/90"
                    >
                      {sending || uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
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

      {/* User Search Modal - Enhanced with Profile View */}
      <AnimatePresence>
        {showUserSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-10 md:pt-20 px-4"
            onClick={() => setShowUserSearch(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">New Message</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowUserSearch(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder="Search users by username..."
                    className="pl-9 bg-muted border-0"
                    autoFocus
                  />
                </div>
              </div>
              <ScrollArea className="max-h-[60vh]">
                {searchingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {userSearchQuery ? "No users found" : "Search for a user to start chatting"}
                  </div>
                ) : (
                  <div>
                    {searchResults.map((profile) => (
                      <div
                        key={profile.user_id}
                        className="p-4 border-b border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <Avatar className="w-14 h-14 shrink-0">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-lg">
                              {(profile.display_name || profile.username || "?").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h4 className="font-bold text-base">
                                {profile.display_name || profile.username || "Unknown"}
                              </h4>
                              {profile.is_verified && (
                                <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              @{profile.username || "user"}
                            </p>
                            {profile.created_at && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Joined {format(new Date(profile.created_at), "MMM yyyy")}</span>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 rounded-full"
                                onClick={() => startConversation(profile)}
                              >
                                <MessageCircle className="w-4 h-4 mr-1.5" />
                                Message
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                asChild
                              >
                                <Link to={`/u/${profile.username}`}>
                                  View Profile
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default Messages;
