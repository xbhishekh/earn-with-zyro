-- Add CASCADE DELETE for all campaign-related foreign keys

-- First, drop existing foreign keys and recreate with CASCADE
ALTER TABLE campaign_members DROP CONSTRAINT IF EXISTS campaign_members_campaign_id_fkey;
ALTER TABLE campaign_members ADD CONSTRAINT campaign_members_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE campaign_assets DROP CONSTRAINT IF EXISTS campaign_assets_campaign_id_fkey;
ALTER TABLE campaign_assets ADD CONSTRAINT campaign_assets_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE campaign_waitlist_requests DROP CONSTRAINT IF EXISTS campaign_waitlist_requests_campaign_id_fkey;
ALTER TABLE campaign_waitlist_requests ADD CONSTRAINT campaign_waitlist_requests_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_campaign_id_fkey;
ALTER TABLE submissions ADD CONSTRAINT submissions_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_campaign_id_fkey;
ALTER TABLE announcements ADD CONSTRAINT announcements_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE affiliate_links DROP CONSTRAINT IF EXISTS affiliate_links_campaign_id_fkey;
ALTER TABLE affiliate_links ADD CONSTRAINT affiliate_links_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_campaign_id_fkey;
ALTER TABLE chat_rooms ADD CONSTRAINT chat_rooms_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE balance_transactions DROP CONSTRAINT IF EXISTS balance_transactions_campaign_id_fkey;
ALTER TABLE balance_transactions ADD CONSTRAINT balance_transactions_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

ALTER TABLE referral_rewards DROP CONSTRAINT IF EXISTS referral_rewards_campaign_id_fkey;
ALTER TABLE referral_rewards ADD CONSTRAINT referral_rewards_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

ALTER TABLE user_suspensions DROP CONSTRAINT IF EXISTS user_suspensions_campaign_id_fkey;
ALTER TABLE user_suspensions ADD CONSTRAINT user_suspensions_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

ALTER TABLE admin_campaign_assignments DROP CONSTRAINT IF EXISTS admin_campaign_assignments_campaign_id_fkey;
ALTER TABLE admin_campaign_assignments ADD CONSTRAINT admin_campaign_assignments_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;