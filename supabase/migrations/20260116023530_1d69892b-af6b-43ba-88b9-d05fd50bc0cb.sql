-- Add reply_to_id column for message threading
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL;

-- Create index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id ON public.chat_messages(reply_to_id);