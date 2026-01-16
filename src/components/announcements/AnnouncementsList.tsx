import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementCard } from './AnnouncementCard';
import { Megaphone, Loader2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  campaign_id: string | null;
  admin_id: string;
}

interface Props {
  campaignId?: string | null;
  limit?: number;
}

export const AnnouncementsList = ({ campaignId, limit }: Props) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => fetchAnnouncements()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const fetchAnnouncements = async () => {
    let query = supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (campaignId) {
      // Campaign-specific announcements OR global announcements
      query = query.or(`campaign_id.eq.${campaignId},campaign_id.is.null`);
    } else {
      // Global announcements only
      query = query.is('campaign_id', null);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (!error && data) {
      setAnnouncements(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Megaphone className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No announcements yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <AnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
};
