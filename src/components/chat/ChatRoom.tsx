import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Send, Loader2, SmilePlus } from 'lucide-react';
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

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🎉'];

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
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('user_id', newMsg.user_id)
            .single();

          setMessages(prev => [...prev, { ...newMsg, profiles: profile || undefined, reactions: [] }]);
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
      {/* Messages Area - Whop Style */}
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
                {/* Date Divider - Whop Style */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-medium text-muted-foreground px-2">{group.date}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Messages */}
                <div className="space-y-1">
                  {group.messages.map((msg, i) => {
                    const isOwn = msg.user_id === user?.id;
                    const showHeader = i === 0 || group.messages[i - 1].user_id !== msg.user_id;
                    const reactionCounts = getReactionCounts(msg.reactions);

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group hover:bg-muted/30 rounded-lg px-2 py-1 -mx-2 transition-colors"
                      >
                        {/* Message with Avatar - Whop Style */}
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
                                {msg.content}
                              </p>

                              {/* Reaction Button - Shows on Hover */}
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

      {/* Input Area - Whop Style */}
      <div className="border-t border-border p-3 bg-background">
        <form onSubmit={sendMessage} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Send a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary pr-12 rounded-xl"
            />
          </div>
          <Button 
            type="submit" 
            size="icon" 
            disabled={sending || !newMessage.trim()}
            className="rounded-xl h-10 w-10 shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};
