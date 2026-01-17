-- Performance indexes for frequently queried tables
-- These indexes optimize common query patterns without affecting existing functionality

-- Campaigns: Indexed for listing pages with status filtering
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created ON public.campaigns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns(slug) WHERE slug IS NOT NULL;

-- Campaign members: Indexed for user membership lookups
CREATE INDEX IF NOT EXISTS idx_campaign_members_user_campaign ON public.campaign_members(user_id, campaign_id);

-- Submissions: Indexed for user/campaign filtering and status queries  
CREATE INDEX IF NOT EXISTS idx_submissions_user_campaign ON public.submissions(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_submissions_campaign_status ON public.submissions(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON public.submissions(status, created_at DESC);

-- Balance transactions: Indexed for user balance calculations
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_status ON public.balance_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_status_release ON public.balance_transactions(status, release_date) WHERE release_date IS NOT NULL;

-- Marketplace products: Indexed for listing and search
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active_featured ON public.marketplace_products(is_active, is_featured DESC, members_count DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_slug ON public.marketplace_products(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON public.marketplace_products(category, is_active);

-- Product purchases: Indexed for buyer/seller lookups
CREATE INDEX IF NOT EXISTS idx_product_purchases_buyer ON public.product_purchases(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_purchases_seller ON public.product_purchases(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_purchases_product ON public.product_purchases(product_id);

-- Chat messages: Indexed for room message loading
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);

-- User roles: Indexed for role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

-- Profiles: Indexed for user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- Notifications: Indexed for user notification lists
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);

-- User suspensions: Indexed for active suspension checks
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user_active ON public.user_suspensions(user_id, is_active) WHERE is_active = true;

-- Waitlist requests: Indexed for campaign waitlist queries
CREATE INDEX IF NOT EXISTS idx_waitlist_requests_user_campaign ON public.campaign_waitlist_requests(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_requests_campaign_status ON public.campaign_waitlist_requests(campaign_id, status);

-- Product reviews: Indexed for product review aggregation
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);

-- Support chats: Indexed for user support lookups
CREATE INDEX IF NOT EXISTS idx_support_chats_user ON public.support_chats(user_id);

-- Affiliate links: Indexed for code lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON public.affiliate_links(code);