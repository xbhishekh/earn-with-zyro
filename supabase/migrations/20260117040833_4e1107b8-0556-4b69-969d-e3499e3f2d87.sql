-- Drop the trigger first, then the function
DROP TRIGGER IF EXISTS trigger_send_campaign_welcome_dm ON public.campaign_members;
DROP TRIGGER IF EXISTS on_campaign_member_joined ON public.campaign_members;
DROP FUNCTION IF EXISTS public.send_campaign_welcome_dm() CASCADE;

-- Recreate the function to send welcome message from campaign creator
CREATE OR REPLACE FUNCTION public.send_campaign_welcome_dm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_record RECORD;
  dm_room_id UUID;
  existing_room_id UUID;
BEGIN
  -- Get campaign details including creator
  SELECT c.name, c.welcome_message, c.created_by
  INTO campaign_record
  FROM public.campaigns c
  WHERE c.id = NEW.campaign_id;
  
  -- Only proceed if campaign has a welcome message and creator
  IF campaign_record.welcome_message IS NULL OR campaign_record.welcome_message = '' THEN
    RETURN NEW;
  END IF;
  
  IF campaign_record.created_by IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Don't send welcome message to the creator themselves
  IF NEW.user_id = campaign_record.created_by THEN
    RETURN NEW;
  END IF;
  
  -- Check if user already has a DM room with campaign creator
  SELECT cr.id INTO existing_room_id
  FROM public.chat_rooms cr
  INNER JOIN public.dm_participants dp1 ON cr.id = dp1.room_id AND dp1.user_id = NEW.user_id
  INNER JOIN public.dm_participants dp2 ON cr.id = dp2.room_id AND dp2.user_id = campaign_record.created_by
  WHERE cr.type = 'dm'
  LIMIT 1;
  
  IF existing_room_id IS NOT NULL THEN
    dm_room_id := existing_room_id;
  ELSE
    -- Create a new DM room
    INSERT INTO public.chat_rooms (type, name)
    VALUES ('dm', NULL)
    RETURNING id INTO dm_room_id;
    
    -- Add both participants
    INSERT INTO public.dm_participants (room_id, user_id)
    VALUES (dm_room_id, NEW.user_id);
    
    INSERT INTO public.dm_participants (room_id, user_id)
    VALUES (dm_room_id, campaign_record.created_by);
  END IF;
  
  -- Send the welcome message from campaign creator
  INSERT INTO public.chat_messages (room_id, user_id, content)
  VALUES (
    dm_room_id,
    campaign_record.created_by,
    '👋 Welcome to **' || campaign_record.name || '**!

' || campaign_record.welcome_message
  );
  
  -- Create a notification for the user
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    'campaign_joined',
    'Welcome to ' || campaign_record.name,
    'You have successfully joined the campaign. Check your messages for more details!',
    jsonb_build_object('campaign_id', NEW.campaign_id, 'campaign_name', campaign_record.name)
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_campaign_member_joined
  AFTER INSERT ON public.campaign_members
  FOR EACH ROW
  EXECUTE FUNCTION public.send_campaign_welcome_dm();