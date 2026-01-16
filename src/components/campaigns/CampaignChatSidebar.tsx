import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Megaphone, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { AnnouncementsList } from '@/components/announcements/AnnouncementsList';
import { useAuth } from '@/hooks/useAuth';

interface CampaignChatSidebarProps {
  campaignId: string;
  campaignName: string;
  chatRoomId: string | null;
  isMember: boolean;
}

export const CampaignChatSidebar = ({ 
  campaignId, 
  campaignName, 
  chatRoomId,
  isMember
}: CampaignChatSidebarProps) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'chat' | 'announcements' | null>('announcements');

  if (!user) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Announcements Section - Collapsible Accordion */}
      <div className="border-b border-border">
        <button
          onClick={() => setActiveSection(activeSection === 'announcements' ? null : 'announcements')}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <span className="font-medium">Announcements</span>
          </div>
          {activeSection === 'announcements' ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {activeSection === 'announcements' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 max-h-[400px] overflow-y-auto">
                <AnnouncementsList campaignId={campaignId} limit={5} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Section - Collapsible Accordion */}
      <div>
        <button
          onClick={() => setActiveSection(activeSection === 'chat' ? null : 'chat')}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="font-medium">Campaign Chat</span>
          </div>
          {activeSection === 'chat' ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {activeSection === 'chat' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="h-[400px]">
                {!isMember ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                    <Lock className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm text-center">Join the campaign to chat with other members</p>
                  </div>
                ) : chatRoomId ? (
                  <ChatRoom roomId={chatRoomId} roomName={campaignName} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Loading chat room...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
