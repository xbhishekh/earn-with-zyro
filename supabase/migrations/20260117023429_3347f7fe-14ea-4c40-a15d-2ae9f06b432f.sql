-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to send payment release DM from Team Zyrozo
CREATE OR REPLACE FUNCTION public.send_payment_release_dm(
  p_user_id UUID,
  p_amount NUMERIC,
  p_username TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dm_room_id UUID;
  zyrozo_team_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  -- Find existing Zyrozo Team DM room for this user
  SELECT cr.id INTO dm_room_id 
  FROM chat_rooms cr
  INNER JOIN dm_participants dp1 ON dp1.room_id = cr.id AND dp1.user_id = p_user_id
  INNER JOIN dm_participants dp2 ON dp2.room_id = cr.id AND dp2.user_id = zyrozo_team_id
  WHERE cr.type = 'dm'
  LIMIT 1;
  
  -- Create new DM room if doesn't exist
  IF dm_room_id IS NULL THEN
    INSERT INTO chat_rooms (type, name) 
    VALUES ('dm', 'Team Zyrozo')
    RETURNING id INTO dm_room_id;
    
    -- Add both participants
    INSERT INTO dm_participants (room_id, user_id) VALUES (dm_room_id, p_user_id);
    INSERT INTO dm_participants (room_id, user_id) VALUES (dm_room_id, zyrozo_team_id);
  END IF;
  
  -- Send payment release message
  INSERT INTO chat_messages (room_id, user_id, content)
  VALUES (
    dm_room_id, 
    zyrozo_team_id,
    '💰 **Payment Released!**

Hey @' || COALESCE(p_username, 'Creator') || '! 

Your payment of **$' || ROUND(p_amount, 2) || '** has been released to your available balance.

You can now withdraw your earnings anytime from your Balance page!

_Team Zyrozo_'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.send_payment_release_dm(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_payment_release_dm(UUID, NUMERIC, TEXT) TO service_role;