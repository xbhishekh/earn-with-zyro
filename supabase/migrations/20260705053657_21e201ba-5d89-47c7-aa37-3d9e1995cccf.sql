
DROP POLICY IF EXISTS "System/Admins can insert transactions" ON public.balance_transactions;
CREATE POLICY "Admins can insert transactions"
  ON public.balance_transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert referral rewards" ON public.referral_rewards;
CREATE POLICY "Admins can insert referral rewards"
  ON public.referral_rewards
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, username, display_name, bio, avatar_url, cover_image_url,
  location, is_verified, show_total_earned, referred_by,
  created_at, updated_at, show_location, show_owned_products, show_joined_products
) ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "Chat participants can view chat attachments" ON storage.objects;
CREATE POLICY "Chat participants can view chat attachments"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND (
      public.is_admin(auth.uid())
      OR (auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.dm_participants dp
        WHERE dp.user_id = auth.uid()
          AND (dp.room_id)::text = (storage.foldername(objects.name))[1]
      )
      OR EXISTS (
        SELECT 1 FROM public.chat_rooms cr
        JOIN public.campaign_members cm ON cm.campaign_id = cr.campaign_id
        WHERE (cr.id)::text = (storage.foldername(objects.name))[1]
          AND cm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can add participants to DM rooms" ON public.dm_participants;
DROP POLICY IF EXISTS "Users can join DM rooms" ON public.dm_participants;
CREATE POLICY "Users can add themselves or complete a new DM"
  ON public.dm_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = dm_participants.room_id AND cr.type = 'dm'
    )
    AND (
      auth.uid() = user_id
      OR (
        EXISTS (
          SELECT 1 FROM public.dm_participants dp
          WHERE dp.room_id = dm_participants.room_id AND dp.user_id = auth.uid()
        )
        AND (
          SELECT count(*) FROM public.dm_participants dp
          WHERE dp.room_id = dm_participants.room_id
        ) < 2
      )
    )
  );

DROP POLICY IF EXISTS "Anyone can view submission videos" ON storage.objects;
CREATE POLICY "Submission videos restricted to members and admins"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'submissions'
    AND (
      public.is_admin(auth.uid())
      OR (auth.uid())::text = (storage.foldername(name))[2]
      OR EXISTS (
        SELECT 1 FROM public.campaign_members cm
        WHERE (cm.campaign_id)::text = (storage.foldername(objects.name))[1]
          AND cm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Anyone can view campaign assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Campaign thumbnails are publicly accessible" ON storage.objects;

REVOKE EXECUTE ON FUNCTION public.auto_leave_campaign_on_ban() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.process_admin_invite() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.process_product_purchase() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.protect_owner_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.send_campaign_welcome_dm() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_discount_code_usage() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_product_members_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_support_chat_on_message() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_and_increment_discount() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_admin_invite_on_signup() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.send_payment_release_dm(uuid, numeric, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.send_views_update_dm(uuid, text, text, integer, numeric, timestamptz, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.send_admin_broadcast_dm(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.delete_broadcast_messages(uuid, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.assign_admin_role_if_user_exists(text, text, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_manage_role(uuid, text) FROM anon, public;
