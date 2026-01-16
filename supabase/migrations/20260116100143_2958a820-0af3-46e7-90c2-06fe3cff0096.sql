
-- Drop old policy and create new one that includes founder
DROP POLICY IF EXISTS "Only owners can view activity logs" ON public.admin_activity_logs;

CREATE POLICY "Founders and owners can view activity logs" 
ON public.admin_activity_logs 
FOR SELECT 
USING (is_founder(auth.uid()) OR is_owner(auth.uid()));
