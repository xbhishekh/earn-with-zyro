import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Flag, 
  Search, 
  Loader2, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  campaign_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  reporter_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  reported_user_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  campaign?: {
    name: string;
    slug: string | null;
  };
}

export const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('admin-reports')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_reports'
      }, () => fetchReports())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('user_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch reports');
      return;
    }

    if (data && data.length > 0) {
      // Fetch profiles for reporters and reported users
      const reporterIds = [...new Set(data.map(r => r.reporter_id))];
      const reportedIds = [...new Set(data.map(r => r.reported_user_id))];
      const campaignIds = [...new Set(data.filter(r => r.campaign_id).map(r => r.campaign_id!))];

      const [reporterProfiles, reportedProfiles, campaigns] = await Promise.all([
        supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', reporterIds),
        supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', reportedIds),
        campaignIds.length > 0 
          ? supabase.from('campaigns').select('id, name, slug').in('id', campaignIds)
          : Promise.resolve({ data: [] as { id: string; name: string; slug: string | null }[] })
      ]);

      const reporterMap = new Map<string, { user_id: string; username: string | null; avatar_url: string | null }>();
      reporterProfiles.data?.forEach(p => reporterMap.set(p.user_id, p));
      
      const reportedMap = new Map<string, { user_id: string; username: string | null; avatar_url: string | null }>();
      reportedProfiles.data?.forEach(p => reportedMap.set(p.user_id, p));
      
      const campaignMap = new Map<string, { id: string; name: string; slug: string | null }>();
      campaigns.data?.forEach(c => campaignMap.set(c.id, c));

      const enrichedReports: Report[] = data.map(report => ({
        ...report,
        reporter_profile: reporterMap.get(report.reporter_id),
        reported_user_profile: reportedMap.get(report.reported_user_id),
        campaign: report.campaign_id ? campaignMap.get(report.campaign_id) : undefined
      }));

      setReports(enrichedReports);
    } else {
      setReports([]);
    }
    
    setLoading(false);
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('user_reports')
        .update({
          status,
          admin_notes: adminNotes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast.success(`Report marked as ${status}`);
      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
    } catch (error) {
      toast.error('Failed to update report');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'reviewed':
        return <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30"><Eye className="h-3 w-3 mr-1" /> Reviewed</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-success/20 text-success border-success/30"><CheckCircle className="h-3 w-3 mr-1" /> Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground"><XCircle className="h-3 w-3 mr-1" /> Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam or misleading',
      harassment: 'Harassment',
      inappropriate: 'Inappropriate content',
      scam: 'Scam or fraud',
      impersonation: 'Impersonation',
      other: 'Other'
    };
    return labels[reason] || reason;
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reporter_profile?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_user_profile?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            User Reports
          </h2>
          <p className="text-sm text-muted-foreground">
            Review and manage user reports from campaigns
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-60"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Flag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No reports found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{getReasonLabel(report.reason)}</span>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Reported:</span>
                      <Link 
                        to={`/user/${report.reported_user_profile?.username || report.reported_user_id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        @{report.reported_user_profile?.username || 'Unknown'}
                      </Link>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>By:</span>
                      <Link 
                        to={`/user/${report.reporter_profile?.username || report.reporter_id}`}
                        className="hover:underline"
                      >
                        @{report.reporter_profile?.username || 'Unknown'}
                      </Link>
                    </div>
                    
                    {report.campaign && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Campaign:</span>
                        <Link 
                          to={`/c/${report.campaign.slug || report.campaign_id}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          {report.campaign.name}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                    
                    {report.details && (
                      <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                        "{report.details}"
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedReport(report);
                    setAdminNotes(report.admin_notes || '');
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Reported User</Label>
                  <p className="font-medium">@{selectedReport.reported_user_profile?.username || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Reporter</Label>
                  <p className="font-medium">@{selectedReport.reporter_profile?.username || 'Unknown'}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Reason</Label>
                <p className="font-medium">{getReasonLabel(selectedReport.reason)}</p>
              </div>

              {selectedReport.details && (
                <div>
                  <Label className="text-muted-foreground text-xs">Details</Label>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedReport.details}</p>
                </div>
              )}

              <div>
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this report..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => updateReportStatus(selectedReport.id, 'dismissed')}
                  disabled={updating}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Dismiss
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateReportStatus(selectedReport.id, 'reviewed')}
                  disabled={updating}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Mark Reviewed
                </Button>
                <Button
                  onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                  disabled={updating}
                  className="bg-success hover:bg-success/90"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Resolve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
