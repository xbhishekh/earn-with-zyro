-- Add welcome_message column to campaigns for auto-DM on join
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS welcome_message TEXT;

-- Add comment
COMMENT ON COLUMN public.campaigns.welcome_message IS 'Automatic welcome message sent to user DM when they join the campaign';

-- Create function to send welcome DM when user joins a campaign
CREATE OR REPLACE FUNCTION public.send_campaign_welcome_dm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  campaign_record RECORD;
  system_user_id UUID := '00000000-0000-0000-0000-000000000000';
  dm_room_id UUID;
  existing_room_id UUID;
BEGIN
  -- Get campaign details
  SELECT name, welcome_message INTO campaign_record
  FROM public.campaigns
  WHERE id = NEW.campaign_id;
  
  -- Only proceed if campaign has a welcome message
  IF campaign_record.welcome_message IS NULL OR campaign_record.welcome_message = '' THEN
    RETURN NEW;
  END IF;
  
  -- Check if user already has a DM room with system/admin
  SELECT cr.id INTO existing_room_id
  FROM public.chat_rooms cr
  JOIN public.dm_participants dp1 ON cr.id = dp1.room_id AND dp1.user_id = NEW.user_id
  WHERE cr.type = 'dm' AND cr.name = 'Zyrozo Team'
  LIMIT 1;
  
  IF existing_room_id IS NOT NULL THEN
    dm_room_id := existing_room_id;
  ELSE
    -- Create a new DM room for system messages
    INSERT INTO public.chat_rooms (type, name)
    VALUES ('dm', 'Zyrozo Team')
    RETURNING id INTO dm_room_id;
    
    -- Add user as participant
    INSERT INTO public.dm_participants (room_id, user_id)
    VALUES (dm_room_id, NEW.user_id);
  END IF;
  
  -- Send the welcome message
  INSERT INTO public.chat_messages (room_id, user_id, content)
  VALUES (
    dm_room_id,
    NEW.user_id, -- We use the user's ID but mark it differently in content
    '🎉 **Welcome to ' || campaign_record.name || '!**

' || campaign_record.welcome_message || '

_This is an automated message from Zyrozo Team_'
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

-- Create trigger for campaign member insert
DROP TRIGGER IF EXISTS trigger_send_campaign_welcome_dm ON public.campaign_members;
CREATE TRIGGER trigger_send_campaign_welcome_dm
  AFTER INSERT ON public.campaign_members
  FOR EACH ROW
  EXECUTE FUNCTION public.send_campaign_welcome_dm();