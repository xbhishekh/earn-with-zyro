import { useEffect, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Reply {
  id: string;
  subject: string;
  body: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface Props {
  inquiryId: string;
  companyName: string;
  email: string;
  onSent?: () => void;
}

export const InquiryReplyBox = ({ inquiryId, companyName, email, onSent }: Props) => {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(`Re: Your campaign inquiry — ${companyName}`);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);

  const loadReplies = async () => {
    const { data } = await supabase
      .from("business_inquiry_replies")
      .select("id, subject, body, status, error_message, created_at")
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: false });
    setReplies((data as Reply[]) || []);
  };

  useEffect(() => {
    loadReplies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryId]);

  const send = async () => {
    if (!message.trim()) {
      toast.error("Write a message first");
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-business-reply", {
      body: { inquiry_id: inquiryId, subject, message },
    });
    setSending(false);

    if (error || (data && data.success === false)) {
      toast.error(data?.error || "Could not send the email. Check email setup.");
      loadReplies();
      return;
    }
    toast.success(`Reply sent to ${email}`);
    setMessage("");
    setOpen(false);
    loadReplies();
    onSent?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Email replies {replies.length > 0 && `(${replies.length})`}
        </p>
        <Button size="sm" variant={open ? "ghost" : "secondary"} onClick={() => setOpen((v) => !v)}>
          <Send className="w-3.5 h-3.5 mr-1.5" />
          {open ? "Cancel" : "Reply by email"}
        </Button>
      </div>

      {open && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder={`Hi there, thanks for reaching out about ${companyName}...`}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={send} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
              Send to {email}
            </Button>
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className="space-y-2">
          {replies.map((r) => (
            <div key={r.id} className="rounded-lg bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{r.subject}</p>
                <span
                  className={
                    r.status === "sent"
                      ? "text-xs text-emerald-600"
                      : "text-xs text-destructive"
                  }
                >
                  {r.status === "sent" ? "sent" : "failed"} · {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-muted-foreground mt-1">{r.body}</p>
              {r.error_message && (
                <p className="text-xs text-destructive mt-1">{r.error_message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InquiryReplyBox;
