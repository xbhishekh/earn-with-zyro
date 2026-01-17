-- Create broadcast_history table to track all admin broadcasts
CREATE TABLE public.broadcast_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID
);

-- Enable RLS
ALTER TABLE public.broadcast_history ENABLE ROW LEVEL SECURITY;

-- Only super_admin, owner, founder can view broadcast history
CREATE POLICY "Super admins can view broadcast history"
ON public.broadcast_history
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Only super_admin, owner, founder can insert
CREATE POLICY "Super admins can insert broadcast history"
ON public.broadcast_history
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- Only super_admin, owner, founder can update (for soft delete)
CREATE POLICY "Super admins can update broadcast history"
ON public.broadcast_history
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Create function to delete broadcast messages from all users
CREATE OR REPLACE FUNCTION public.delete_broadcast_messages(p_broadcast_id uuid, p_title text, p_content text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
  zyrozo_team_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  expected_content TEXT;
BEGIN
  -- Only allow super admins to delete
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can delete broadcasts';
  END IF;

  -- Build the expected message content
  expected_content := '📢 **' || p_title || '**

' || p_content || '

_Team Zyrozo_';

  -- Delete all matching messages from Team Zyrozo
  DELETE FROM chat_messages
  WHERE user_id = zyrozo_team_id
    AND content = expected_content;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Mark broadcast as deleted
  UPDATE broadcast_history
  SET deleted_at = now(), deleted_by = auth.uid()
  WHERE id = p_broadcast_id;

  RETURN deleted_count;
END;
$$;

-- Update send_admin_broadcast_dm to also log to history
CREATE OR REPLACE FUNCTION public.send_admin_broadcast_dm(p_title text, p_content text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  dm_room_id UUID;
  zyrozo_team_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  users_notified INTEGER := 0;
BEGIN
  -- Loop through all users with profiles
  FOR user_record IN 
    SELECT DISTINCT p.user_id 
    FROM profiles p
    WHERE p.user_id != zyrozo_team_id
  LOOP
    -- Find or create DM room with Team Zyrozo
    SELECT cr.id INTO dm_room_id 
    FROM chat_rooms cr
    INNER JOIN dm_participants dp1 ON dp1.room_id = cr.id AND dp1.user_id = user_record.user_id
    INNER JOIN dm_participants dp2 ON dp2.room_id = cr.id AND dp2.user_id = zyrozo_team_id
    WHERE cr.type = 'dm'
    LIMIT 1;
    
    IF dm_room_id IS NULL THEN
      INSERT INTO chat_rooms (type, name) 
      VALUES ('dm', 'Team Zyrozo')
      RETURNING id INTO dm_room_id;
      
      INSERT INTO dm_participants (room_id, user_id) VALUES (dm_room_id, user_record.user_id);
      INSERT INTO dm_participants (room_id, user_id) VALUES (dm_room_id, zyrozo_team_id);
    END IF;
    
    -- Send broadcast message
    INSERT INTO chat_messages (room_id, user_id, content)
    VALUES (
      dm_room_id, 
      zyrozo_team_id,
      '📢 **' || p_title || '**

' || p_content || '

_Team Zyrozo_'
    );
    
    users_notified := users_notified + 1;
  END LOOP;
  
  -- Log to broadcast history
  INSERT INTO broadcast_history (admin_id, title, content, recipients_count)
  VALUES (auth.uid(), p_title, p_content, users_notified);
  
  RETURN users_notified;
END;
$$;