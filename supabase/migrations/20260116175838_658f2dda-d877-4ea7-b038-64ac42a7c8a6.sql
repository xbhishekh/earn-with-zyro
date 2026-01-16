-- Fix: Allow users to delete their own social accounts
CREATE POLICY "Users can delete own social accounts"
ON public.social_accounts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix: Add WITH CHECK clause to update policy for completeness
DROP POLICY IF EXISTS "Users can update own social accounts" ON public.social_accounts;
CREATE POLICY "Users can update own social accounts"
ON public.social_accounts
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR is_admin(auth.uid()))
WITH CHECK ((auth.uid() = user_id) OR is_admin(auth.uid()));