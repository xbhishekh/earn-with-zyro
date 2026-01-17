-- Create function to send views update DM from Team Zyrozo (like Whop's payout notifications)
CREATE OR REPLACE FUNCTION public.send_views_update_dm(
  p_user_id UUID,
  p_username TEXT,
  p_campaign_name TEXT,
  p_views INTEGER,
  p_amount NUMERIC,
  p_release_date TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dm_room_id UUID;
  zyrozo_team_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  formatted_date TEXT;
BEGIN
  -- Format release date
  formatted_date := TO_CHAR(p_release_date, 'Mon DD, YYYY');
  
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
  
  -- Send views update/payout message (Whop-style gradient message format)
  INSERT INTO chat_messages (room_id, user_id, content)
  VALUES (
    dm_room_id, 
    zyrozo_team_id,
    '@Zyrozo paid @' || COALESCE(p_username, 'Creator') || ' $' || ROUND(p_amount, 2) || ' for getting views on your content. 💸'
  );
END;
$$;

-- Create function to send admin broadcast DM to all users
CREATE OR REPLACE FUNCTION public.send_admin_broadcast_dm(
  p_title TEXT,
  p_content TEXT
)
RETURNS INTEGER
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
  
  RETURN users_notified;
END;
$$;