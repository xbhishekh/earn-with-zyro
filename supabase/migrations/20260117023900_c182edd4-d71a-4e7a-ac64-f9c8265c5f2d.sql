-- Update Team Zyrozo profile to use the Zyrozo logo from the app
UPDATE public.profiles 
SET avatar_url = '/favicon.jpeg'
WHERE user_id = '00000000-0000-0000-0000-000000000001';