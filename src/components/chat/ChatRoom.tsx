import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Send, Loader2, SmilePlus, AtSign } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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

export const ChatRoom = ({ roomId, roomName }: Props) => {
  const { user } = useAuth();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    fetchMessages();

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
  }, [roomId]);

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
      
      const messagesWithData = data.map(m => ({
        ...m,
        profiles: profileMap.get(m.user_id) as Profile | undefined,
        reactions: reactionsMap.get(m.id) || []
      }));
      
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
    if (!newMessage.trim() || !user) return;

    setSending(true);
    broadcastTyping(false);
    
    const { error } = await supabase.from('chat_messages').insert({
      room_id: roomId,
      user_id: user.id,
      content: newMessage.trim(),
    });
    setSending(false);

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
    }
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

  // Render message content with highlighted @mentions
  const renderMessageContent = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      const username = match[1];
      const mentionedUser = roomMembers.find(m => m.username?.toLowerCase() === username.toLowerCase());
      
      parts.push(
        <Link
          key={match.index}
          to={`/profile/${username}`}
          className="text-primary font-medium hover:underline bg-primary/10 px-1 rounded"
        >
          @{username}
        </Link>
      );
      
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
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

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group hover:bg-muted/30 rounded-lg px-2 py-1 -mx-2 transition-colors"
                      >
                        <div className="flex gap-3">
                          {/* Avatar Column */}
                          {showHeader ? (
                            <Link to={`/profile/${msg.profiles?.username || msg.user_id}`} className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-sm font-semibold overflow-hidden ring-2 ring-background">
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
                              <div className="flex items-baseline gap-2 mb-0.5">
                                <Link 
                                  to={`/profile/${msg.profiles?.username || msg.user_id}`}
                                  className="font-semibold text-sm text-foreground hover:underline"
                                >
                                  {msg.profiles?.username || 'Unknown'}
                                </Link>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(msg.created_at)}
                                </span>
                              </div>
                            )}
                            
                            {/* Message Content */}
                            <div className="relative">
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                                {renderMessageContent(msg.content)}
                              </p>

                              {/* Reaction Button */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button 
                                    className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted bg-background border border-border shadow-sm"
                                  >
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

      {/* Input Area with Mentions */}
      <div className="border-t border-border p-3 bg-background relative">
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
            disabled={sending || !newMessage.trim()}
            className="rounded-xl h-11 w-11 shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
