-- Update the send_views_update_dm function to use Whop-style format with campaign admin username
DROP FUNCTION IF EXISTS public.send_views_update_dm(uuid, text, text, integer, numeric, timestamp with time zone);

CREATE OR REPLACE FUNCTION public.send_views_update_dm(
  p_user_id uuid, 
  p_username text, 
  p_campaign_name text, 
  p_views integer, 
  p_amount numeric, 
  p_release_date timestamp with time zone,
  p_admin_username text DEFAULT 'Zyrozo'
)
RETURNS void
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
  
  -- Send Whop-style views update/payout message
  -- Format: @admin paid @user $X.XX for getting views on your content. 💸
  INSERT INTO chat_messages (room_id, user_id, content)
  VALUES (
    dm_room_id, 
    zyrozo_team_id,
    '@' || COALESCE(p_admin_username, 'Zyrozo') || ' paid @' || COALESCE(p_username, 'Creator') || ' $' || ROUND(p_amount, 2) || ' for getting views on your content. 💸'
  );
END;
$$;