import { Pin, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  admin_username?: string;
}

interface Props {
  announcement: Announcement;
}

export const AnnouncementCard = ({ announcement }: Props) => {
  return (
    <div className={`p-4 rounded-lg border ${announcement.is_pinned ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${announcement.is_pinned ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {announcement.is_pinned ? (
            <Pin className="h-4 w-4" />
          ) : (
            <Megaphone className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-foreground">{announcement.title}</h4>
            {announcement.is_pinned && (
              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-0">
                Pinned
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
            {announcement.content}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {announcement.admin_username && (
              <span>by {announcement.admin_username}</span>
            )}
            <span>•</span>
            <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
