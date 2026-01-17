-- Allow admins (as defined by public.is_admin) to update any profile (e.g., verify/unverify users)
-- Existing policy only allows users to update their own profile.

DO $$
BEGIN
  -- Drop if exists to make migration idempotent
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can update any profile'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can update any profile" ON public.profiles';
  END IF;
END $$;

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
