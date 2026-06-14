
-- 1) Fix privilege escalation on user_roles: drop self-insert policy.
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;

CREATE POLICY "Only super admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- 2) Hide payment_details from other users via column-level grants.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, user_id, username, display_name, bio, avatar_url, cover_image_url,
  location, is_verified, show_total_earned, referred_by, created_at, updated_at,
  show_location, show_owned_products, show_joined_products
) ON public.profiles TO anon, authenticated;

-- Owners need to read their own payment_details column directly.
-- Provide a tight policy elsewhere via existing get_own_payment_details() RPC; no broad SELECT grant for payment_details column.

-- 3) Submissions: restrict approved view to authenticated users only.
DROP POLICY IF EXISTS "Anyone can view approved submissions" ON public.submissions;
CREATE POLICY "Authenticated users can view approved submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (status = ANY (ARRAY['approved'::text, 'paid'::text]));

-- 4) Discount codes: restrict reads to authenticated users.
DROP POLICY IF EXISTS "Anyone can view active discount codes" ON public.discount_codes;
CREATE POLICY "Authenticated users can view active discount codes"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (is_active = true);

-- 5) Chat rooms: scope visibility.
DROP POLICY IF EXISTS "Anyone can view chat rooms" ON public.chat_rooms;

CREATE POLICY "Public can view active campaign chat rooms"
ON public.chat_rooms
FOR SELECT
TO anon, authenticated
USING (
  campaign_id IS NOT NULL
);

CREATE POLICY "Participants can view their DM rooms"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  type = 'dm' AND public.user_is_dm_participant(id)
);

CREATE POLICY "Admins can view all chat rooms"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 6) Storage: restrict chat-attachments SELECT.
DROP POLICY IF EXISTS "Anyone can view chat attachments" ON storage.objects;

CREATE POLICY "Chat participants can view chat attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments' AND (
    public.is_admin(auth.uid())
    OR (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.dm_participants dp
      WHERE dp.user_id = auth.uid()
        AND dp.room_id::text = (storage.foldername(name))[1]
    )
    OR EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      JOIN public.campaign_members cm ON cm.campaign_id = cr.campaign_id
      WHERE cr.id::text = (storage.foldername(name))[1]
        AND cm.user_id = auth.uid()
    )
  )
);
