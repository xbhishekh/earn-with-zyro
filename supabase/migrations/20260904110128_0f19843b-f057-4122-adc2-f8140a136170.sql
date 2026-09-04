DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
  stmt text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    new_qual := p.qual;
    new_check := p.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, 'auth.uid()', '(SELECT auth.uid())');
      new_qual := replace(new_qual, 'auth.jwt()', '(SELECT auth.jwt())');
      new_qual := replace(new_qual, 'auth.role()', '(SELECT auth.role())');
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := replace(new_check, 'auth.uid()', '(SELECT auth.uid())');
      new_check := replace(new_check, 'auth.jwt()', '(SELECT auth.jwt())');
      new_check := replace(new_check, 'auth.role()', '(SELECT auth.role())');
    END IF;

    IF new_qual IS DISTINCT FROM p.qual OR new_check IS DISTINCT FROM p.with_check THEN
      stmt := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
      IF new_qual IS NOT NULL THEN
        stmt := stmt || format(' USING (%s)', new_qual);
      END IF;
      IF new_check IS NOT NULL THEN
        stmt := stmt || format(' WITH CHECK (%s)', new_check);
      END IF;
      EXECUTE stmt;
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON public.social_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_created ON public.submissions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_campaign_status ON public.submissions (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_announcements_campaign_created ON public.announcements (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON public.referral_rewards (referrer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active_created ON public.marketplace_products (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller ON public.marketplace_products (seller_id);
CREATE INDEX IF NOT EXISTS idx_product_purchases_buyer ON public.product_purchases (buyer_id);
CREATE INDEX IF NOT EXISTS idx_product_purchases_product ON public.product_purchases (product_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_status ON public.withdrawal_requests (user_id, status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status_created ON public.user_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_user ON public.affiliate_links (user_id);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user_active ON public.user_suspensions (user_id, is_active);

ANALYZE;