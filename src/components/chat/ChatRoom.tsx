import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Send, Loader2, Trash2, SmilePlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Profile {
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

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

export const ChatRoom = ({ roomId, roomName }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime messages
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
          // Fetch the profile for this message
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('user_id', newMsg.user_id)
            .single();

          setMessages(prev => [...prev, { ...newMsg, profiles: profile || undefined, reactions: [] }]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const deletedMsg = payload.old as { id: string };
          setMessages(prev => prev.filter(m => m.id !== deletedMsg.id));
        }
      )
      .subscribe();

    // Subscribe to reactions
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
          // Refetch messages to get updated reactions
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
      // Fetch profiles for all messages
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
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

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to delete message');
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    // Check if user already reacted with this emoji
    const message = messages.find(m => m.id === messageId);
    const existingReaction = message?.reactions?.find(
      r => r.user_id === user.id && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      await supabase
        .from('chat_message_reactions')
        .delete()
        .eq('id', existingReaction.id);
    } else {
      // Add reaction
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
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-muted px-3 py-1 rounded-full">
                  <span className="text-xs text-muted-foreground">{group.date}</span>
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {group.messages.map((msg, i) => {
                  const isOwn = msg.user_id === user?.id;
                  const showAvatar = i === 0 || group.messages[i - 1].user_id !== msg.user_id;
                  const showTime = i === group.messages.length - 1 || group.messages[i + 1].user_id !== msg.user_id;
                  const reactionCounts = getReactionCounts(msg.reactions);

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      {showAvatar ? (
                        <Link to={`/profile/${msg.profiles?.username || msg.user_id}`} className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium overflow-hidden">
                            {msg.profiles?.avatar_url ? (
                              <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              msg.profiles?.username?.[0]?.toUpperCase() || '?'
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )}

                      {/* Message Bubble */}
                      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        {showAvatar && (
                          <Link to={`/profile/${msg.profiles?.username || msg.user_id}`}>
                            <span className="text-xs text-muted-foreground mb-1 hover:text-primary transition-colors">
                              {msg.profiles?.username || 'Unknown'}
                            </span>
                          </Link>
                        )}
                        
                        <div className="group relative">
                          {isOwn ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <div className="bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-tr-sm cursor-pointer hover:opacity-90 transition-opacity">
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => deleteMessage(msg.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <div className="bg-muted px-3 py-2 rounded-2xl rounded-tl-sm">
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                          )}

                          {/* Reaction button */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button 
                                className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted`}
                              >
                                <SmilePlus className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" side="top">
                              <div className="flex gap-1">
                                {REACTION_EMOJIS.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(msg.id, emoji)}
                                    className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Reactions display */}
                        <AnimatePresence>
                          {reactionCounts.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex gap-1 mt-1"
                            >
                              {reactionCounts.map(({ emoji, count, hasUserReacted }) => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(msg.id, emoji)}
                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
                                    hasUserReacted 
                                      ? 'bg-primary/20 border border-primary/30' 
                                      : 'bg-muted hover:bg-muted/80 border border-transparent'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span className="text-muted-foreground">{count}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {showTime && (
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {formatTime(msg.created_at)}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          className="bg-muted/50 border-border focus:border-primary"
        />
        <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};
