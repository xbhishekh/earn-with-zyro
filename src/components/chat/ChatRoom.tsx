import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatNotification } from '@/hooks/useChatNotification';
import { toast } from 'sonner';
import { Send, Loader2, SmilePlus, AtSign, Search, X, Paperclip, Image as ImageIcon, FileText, Download, Reply, CornerDownRight, BadgeCheck } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface Profile {
  user_id?: string;
  username: string | null;
  avatar_url: string | null;
}

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
  reactions?: Reaction[];
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  reply_to_id?: string | null;
  reply_to?: Message | null;
}

interface Props {
  roomId: string;
  roomName: string;
}

interface TypingUser {
  id: string;
  username: string;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🎉'];
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ChatRoom = ({ roomId, roomName }: Props) => {
  const { user } = useAuth();
  const { notify } = useChatNotification();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [roomMembers, setRoomMembers] = useState<Profile[]>([]);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  
  // File upload state
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Track if this is initial load (don't notify on initial load)
  const isInitialLoadRef = useRef(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch room members for @mentions
  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .limit(100);
      
      if (data) {
        setRoomMembers(data);
      }
    };
    fetchMembers();
  }, [roomId]);

  // Filter members for mention autocomplete
  const filteredMembers = useMemo(() => {
    if (!mentionSearch) return roomMembers.filter(m => m.user_id !== user?.id).slice(0, 5);
    return roomMembers
      .filter(m => 
        m.user_id !== user?.id && 
        m.username?.toLowerCase().includes(mentionSearch.toLowerCase())
      )
      .slice(0, 5);
  }, [roomMembers, mentionSearch, user?.id]);

  // Search messages
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = messages.filter(msg =>
      msg.content.toLowerCase().includes(query.toLowerCase()) ||
      msg.profiles?.username?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  }, [messages]);

  const scrollToMessage = (messageId: string) => {
    const element = messageRefs.current.get(messageId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('File type not allowed. Please upload images, PDFs, or documents.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; type: string; name: string } | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error('Failed to upload file');
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      name: file.name
    };
  };

  // Setup presence channel for typing indicators
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`typing-${roomId}`, {
      config: { presence: { key: user.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing: TypingUser[] = [];
        
        Object.entries(state).forEach(([id, presences]) => {
          const presence = presences[0] as { typing?: boolean; username?: string; presence_ref: string };
          if (id !== user.id && presence?.typing) {
            typing.push({
              id,
              username: presence.username || 'Someone'
            });
          }
        });
        
        setTypingUsers(typing);
      })
      .subscribe();

    presenceChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, user]);

  // Broadcast typing status
  const broadcastTyping = useCallback(async (isTyping: boolean) => {
    if (!presenceChannelRef.current || !user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .single();

    await presenceChannelRef.current.track({
      typing: isTyping,
      username: profile?.username || 'Someone'
    });
  }, [user]);

  const handleTyping = useCallback(() => {
    broadcastTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 2000);
  }, [broadcastTyping]);

  useEffect(() => {
    fetchMessages().then(() => {
      // Mark initial load as complete after messages are fetched
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 1000);
    });

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('user_id', newMsg.user_id)
            .single();

          setMessages(prev => [...prev, { ...newMsg, profiles: profile || undefined, reactions: [] }]);
          
          // Play notification sound and show toast for messages from other users
          // Only if not initial load and message is from someone else
          if (!isInitialLoadRef.current && newMsg.user_id !== user?.id) {
            const senderName = profile?.username || 'Someone';
            const messagePreview = newMsg.content.length > 50 
              ? newMsg.content.substring(0, 50) + '...' 
              : newMsg.content || '📎 Sent an attachment';
            notify(senderName, messagePreview, profile?.avatar_url || undefined);
          }
        }
      )
      .subscribe();

    const reactionsChannel = supabase
      .channel(`reactions-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_message_reactions',
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [roomId, user?.id, notify]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      const userIds = [...new Set(data.map(m => m.user_id))];
      const messageIds = data.map(m => m.id);
      const replyToIds = data.filter(m => m.reply_to_id).map(m => m.reply_to_id);
      
      const [profilesRes, reactionsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', userIds),
        supabase.from('chat_message_reactions').select('*').in('message_id', messageIds)
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
      const reactionsMap = new Map<string, Reaction[]>();
      
      reactionsRes.data?.forEach(r => {
        const existing = reactionsMap.get(r.message_id) || [];
        existing.push(r);
        reactionsMap.set(r.message_id, existing);
      });

      // Create a map of all messages for reply lookup
      const messageMap = new Map(data.map(m => [m.id, m]));
      
      const messagesWithData = data.map(m => {
        const replyToMsg = m.reply_to_id ? messageMap.get(m.reply_to_id) : null;
        return {
          ...m,
          profiles: profileMap.get(m.user_id) as Profile | undefined,
          reactions: reactionsMap.get(m.id) || [],
          reply_to: replyToMsg ? {
            ...replyToMsg,
            profiles: profileMap.get(replyToMsg.user_id) as Profile | undefined
          } : null
        };
      });
      
      setMessages(messagesWithData);
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    setNewMessage(value);
    setCursorPosition(position);
    handleTyping();

    // Check for @ mention trigger
    const textBeforeCursor = value.substring(0, position);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      setShowMentions(true);
      setMentionSearch(atMatch[1]);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMembers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const insertMention = (member: Profile) => {
    const textBeforeCursor = newMessage.substring(0, cursorPosition);
    const textAfterCursor = newMessage.substring(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    const newText = textBeforeCursor.substring(0, atIndex) + 
                    `@${member.username} ` + 
                    textAfterCursor;
    
    setNewMessage(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !user) return;

    setSending(true);
    setUploading(!!selectedFile);
    broadcastTyping(false);

    let attachment: { url: string; type: string; name: string } | null = null;
    
    if (selectedFile) {
      attachment = await uploadFile(selectedFile);
      if (!attachment && !newMessage.trim()) {
        setSending(false);
        setUploading(false);
        return;
      }
    }
    
    const { error } = await supabase.from('chat_messages').insert({
      room_id: roomId,
      user_id: user.id,
      content: newMessage.trim(),
      attachment_url: attachment?.url || null,
      attachment_type: attachment?.type || null,
      attachment_name: attachment?.name || null,
      reply_to_id: replyingTo?.id || null,
    });
    
    setSending(false);
    setUploading(false);

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
      clearSelectedFile();
      setReplyingTo(null);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    const existingReaction = message?.reactions?.find(
      r => r.user_id === user.id && r.emoji === emoji
    );

    if (existingReaction) {
      await supabase
        .from('chat_message_reactions')
        .delete()
        .eq('id', existingReaction.id);
    } else {
      await supabase.from('chat_message_reactions').insert({
        message_id: messageId,
        user_id: user.id,
        emoji: emoji,
      });
    }
  };

  const getReactionCounts = (reactions: Reaction[] = []) => {
    const counts: { emoji: string; count: number; hasUserReacted: boolean }[] = [];
    const emojiMap = new Map<string, { count: number; users: string[] }>();

    reactions.forEach(r => {
      const existing = emojiMap.get(r.emoji) || { count: 0, users: [] };
      existing.count++;
      existing.users.push(r.user_id);
      emojiMap.set(r.emoji, existing);
    });

    emojiMap.forEach((value, emoji) => {
      counts.push({
        emoji,
        count: value.count,
        hasUserReacted: value.users.includes(user?.id || '')
      });
    });

    return counts;
  };

  // Render message content with highlighted @mentions and search highlighting
  const renderMessageContent = (content: string, isSearchHighlight = false) => {
    let processedContent = content;
    
    // Highlight search query
    if (searchQuery && isSearchHighlight) {
      const regex = new RegExp(`(${searchQuery})`, 'gi');
      processedContent = processedContent.replace(regex, '|||HIGHLIGHT|||$1|||/HIGHLIGHT|||');
    }

    const mentionRegex = /@(\w+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = mentionRegex.exec(processedContent)) !== null) {
      if (match.index > lastIndex) {
        const textPart = processedContent.substring(lastIndex, match.index);
        parts.push(...renderSearchHighlight(textPart, keyIndex));
        keyIndex++;
      }
      
      const username = match[1].replace(/\|\|\|HIGHLIGHT\|\|\|/g, '').replace(/\|\|\|\/HIGHLIGHT\|\|\|/g, '');
      
      parts.push(
        <Link
          key={`mention-${keyIndex}`}
          to={`/u/${username}`}
          className="text-primary font-medium hover:underline bg-primary/10 px-1 rounded"
        >
          @{username}
        </Link>
      );
      keyIndex++;
      
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < processedContent.length) {
      parts.push(...renderSearchHighlight(processedContent.substring(lastIndex), keyIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const renderSearchHighlight = (text: string, baseKey: number): (string | JSX.Element)[] => {
    if (!text.includes('|||HIGHLIGHT|||')) return [text];
    
    const parts: (string | JSX.Element)[] = [];
    const segments = text.split(/\|\|\|HIGHLIGHT\|\|\||\|\|\|\/HIGHLIGHT\|\|\|/);
    
    segments.forEach((segment, i) => {
      if (i % 2 === 1) {
        parts.push(
          <span key={`highlight-${baseKey}-${i}`} className="bg-yellow-400/50 text-foreground px-0.5 rounded">
            {segment}
          </span>
        );
      } else if (segment) {
        parts.push(segment);
      }
    });
    
    return parts;
  };

  const renderAttachment = (msg: Message) => {
    if (!msg.attachment_url) return null;

    if (msg.attachment_type === 'image') {
      return (
        <div className="mt-2 max-w-xs">
          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
            <img 
              src={msg.attachment_url} 
              alt={msg.attachment_name || 'Image'} 
              className="rounded-lg border border-border max-h-64 object-cover hover:opacity-90 transition-opacity cursor-pointer"
            />
          </a>
        </div>
      );
    }

    return (
      <a 
        href={msg.attachment_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors max-w-xs"
      >
        <FileText className="h-8 w-8 text-primary shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{msg.attachment_name}</p>
          <p className="text-xs text-muted-foreground">Click to download</p>
        </div>
        <Download className="h-4 w-4 text-muted-foreground shrink-0" />
      </a>
    );
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-10"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  <p className="text-xs text-muted-foreground px-1">{searchResults.length} result(s)</p>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => scrollToMessage(result.id)}
                      className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">{result.profiles?.username}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(result.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground/80 truncate">{result.content}</p>
                    </button>
                  ))}
                </div>
              )}
              
              {searchQuery && searchResults.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground text-center py-2">No messages found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Search Toggle */}
      <div className="flex items-center justify-end p-2 border-b border-border">
        <Button
          variant={showSearch ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => {
            setShowSearch(!showSearch);
            if (showSearch) {
              setSearchQuery('');
              setSearchResults([]);
            }
          }}
          className="h-8 w-8"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Send className="h-7 w-7 text-primary" />
            </div>
            <p className="font-medium text-foreground">No messages yet</p>
            <p className="text-sm text-center mt-1">Be the first to send a message!</p>
          </div>
        ) : (
          <div className="px-4 py-2">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-medium text-muted-foreground px-2">{group.date}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Messages */}
                <div className="space-y-1">
                  {group.messages.map((msg, i) => {
                    const showHeader = i === 0 || group.messages[i - 1].user_id !== msg.user_id;
                    const reactionCounts = getReactionCounts(msg.reactions);
                    const isHighlighted = highlightedMessageId === msg.id;

                    return (
                      <motion.div
                        key={msg.id}
                        ref={(el) => el && messageRefs.current.set(msg.id, el)}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          backgroundColor: isHighlighted ? 'hsl(var(--primary) / 0.15)' : 'transparent'
                        }}
                        transition={{ duration: 0.3 }}
                        className={`group hover:bg-muted/30 rounded-lg px-2 py-1 -mx-2 transition-colors ${
                          isHighlighted ? 'ring-2 ring-primary/50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Avatar Column */}
                          {showHeader ? (
                            <Link to={`/u/${msg.profiles?.username || msg.user_id}`} className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-sm font-semibold overflow-hidden ring-2 ring-background hover:ring-primary/50 transition-all">
                                {msg.profiles?.avatar_url ? (
                                  <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  msg.profiles?.username?.[0]?.toUpperCase() || '?'
                                )}
                              </div>
                            </Link>
                          ) : (
                            <div className="w-10 flex-shrink-0 flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                {formatTime(msg.created_at)}
                              </span>
                            </div>
                          )}

                          {/* Content Column */}
                          <div className="flex-1 min-w-0">
                            {showHeader && (
                              <div className="flex items-center gap-2 mb-0.5">
                                <Link 
                                  to={`/u/${msg.profiles?.username || msg.user_id}`}
                                  className="font-semibold text-sm text-foreground hover:underline flex items-center gap-1"
                                >
                                  {msg.profiles?.username || 'Unknown'}
                                  {/* Verified checkmark for Team Zyrozo */}
                                  {msg.user_id === '00000000-0000-0000-0000-000000000001' && (
                                    <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                                  )}
                                </Link>
                                {/* System Message Badge for Team Zyrozo */}
                                {msg.user_id === '00000000-0000-0000-0000-000000000001' && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-full uppercase tracking-wide">
                                    System
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(msg.created_at)}
                                </span>
                              </div>
                            )}

                            {/* Reply Preview */}
                            {msg.reply_to && (
                              <button
                                onClick={() => scrollToMessage(msg.reply_to!.id)}
                                className="flex items-start gap-2 mb-1.5 p-2 bg-muted/50 rounded-lg border-l-2 border-primary/50 hover:bg-muted/70 transition-colors text-left w-full max-w-md"
                              >
                                <CornerDownRight className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-medium text-primary">
                                    {msg.reply_to.profiles?.username || 'Unknown'}
                                  </span>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {msg.reply_to.content || (msg.reply_to.attachment_name ? `📎 ${msg.reply_to.attachment_name}` : 'Attachment')}
                                  </p>
                                </div>
                              </button>
                            )}
                            
                            {/* Message Content */}
                            <div className="relative">
                              {msg.content && (
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                                  {renderMessageContent(msg.content, !!searchQuery)}
                                </p>
                              )}
                              
                              {/* Attachment */}
                              {renderAttachment(msg)}

                              {/* Action Buttons */}
                              <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-background border border-border rounded-md shadow-sm">
                                {/* Reply Button */}
                                <button
                                  onClick={() => handleReply(msg)}
                                  className="p-1.5 hover:bg-muted rounded-l-md transition-colors"
                                  title="Reply"
                                >
                                  <Reply className="h-4 w-4 text-muted-foreground" />
                                </button>
                                
                                {/* Reaction Button */}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="p-1.5 hover:bg-muted rounded-r-md transition-colors">
                                      <SmilePlus className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-1.5" side="top" align="end">
                                    <div className="flex gap-0.5">
                                      {REACTION_EMOJIS.map(emoji => (
                                        <button
                                          key={emoji}
                                          onClick={() => toggleReaction(msg.id, emoji)}
                                          className="p-1.5 hover:bg-muted rounded-md transition-colors text-base hover:scale-110 active:scale-95"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>

                            {/* Reactions Display */}
                            <AnimatePresence>
                              {reactionCounts.length > 0 && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  className="flex flex-wrap gap-1 mt-1.5"
                                >
                                  {reactionCounts.map(({ emoji, count, hasUserReacted }) => (
                                    <button
                                      key={emoji}
                                      onClick={() => toggleReaction(msg.id, emoji)}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                                        hasUserReacted 
                                          ? 'bg-primary/15 text-primary border border-primary/30' 
                                          : 'bg-muted/80 text-muted-foreground border border-transparent hover:bg-muted'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span>{count}</span>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 border-t border-border bg-muted/30"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>
                {typingUsers.length === 1 
                  ? `${typingUsers[0].username} is typing...`
                  : typingUsers.length === 2
                  ? `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2 border-t border-border bg-muted/30"
          >
            <div className="flex items-center gap-3 p-2 bg-background rounded-lg border border-border">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-12 h-12 rounded-md object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelectedFile}
                className="h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Preview Bar */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2 border-t border-border bg-muted/30"
          >
            <div className="flex items-center gap-3 p-2 bg-background rounded-lg border-l-2 border-primary">
              <Reply className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary">
                  Replying to {replyingTo.profiles?.username || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {replyingTo.content || (replyingTo.attachment_name ? `📎 ${replyingTo.attachment_name}` : 'Attachment')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelReply}
                className="h-6 w-6 shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area with Mentions */}
      <div className="border-t border-border p-3 bg-background relative">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Mentions Autocomplete */}
        <AnimatePresence>
          {showMentions && filteredMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-3 right-3 mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-1">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <AtSign className="h-3 w-3" />
                  Mention someone
                </div>
                {filteredMembers.map((member, index) => (
                  <button
                    key={member.user_id}
                    onClick={() => insertMention(member)}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
                      index === mentionIndex ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium overflow-hidden">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        member.username?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    <span className="font-medium text-sm">{member.username}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          {/* Attachment Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl"
                disabled={sending}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" side="top" align="start">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
              >
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Upload Image
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Upload File
              </button>
            </PopoverContent>
          </Popover>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              placeholder="Send a message... Use @ to mention"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={sending}
              rows={1}
              className="w-full resize-none bg-muted/50 border-0 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground disabled:opacity-50"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <Button 
            type="button"
            onClick={handleSendMessage}
            size="icon" 
            disabled={sending || (!newMessage.trim() && !selectedFile)}
            className="rounded-xl h-11 w-11 shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
