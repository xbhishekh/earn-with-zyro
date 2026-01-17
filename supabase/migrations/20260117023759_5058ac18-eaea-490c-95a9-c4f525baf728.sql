-- Drop the foreign key constraint on profiles.user_id if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Insert the Team Zyrozo system profile
INSERT INTO public.profiles (id, user_id, username, display_name, avatar_url, bio, is_verified)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'zyrozo_team',
  'Team Zyrozo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=zyrozo&backgroundColor=6366f1&scale=90',
  'Official Zyrozo support & notifications account. We send you important updates about your earnings and account.',
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  username = 'zyrozo_team',
  display_name = 'Team Zyrozo',
  avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=zyrozo&backgroundColor=6366f1&scale=90',
  bio = 'Official Zyrozo support & notifications account. We send you important updates about your earnings and account.',
  is_verified = true;