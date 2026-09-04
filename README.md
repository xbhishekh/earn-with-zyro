# Remix of klip

Main samajh gaya! Aap **new Lovable project** mein **Zyrozo.com** ko 0 se build karna chahte ho jisme:
1. Sabhi pages working hon
2. Koi loading issue na ho
3. API keys pehle se maang lein

Pehle main current project ki kuch aur files check kar leta hoon taaki complete specification de sakun:

Excellent! Main saari files check kar li hain. Ab main aapko **COMPLETE STEP-BY-STEP PROMPT** de raha hoon jo aap **NEW Lovable project** mein use kar sakte ho. Yeh specification har ek detail include karti hai:

# ZYROZO.COM - Complete Build Specification for New Lovable Project

## STEP 1: API KEYS REQUIRED (Request First!)

Before starting, you need **ONE** API key:

**RESEND_API_KEY** - For sending OTP emails
- Get it from: https://resend.com (Free tier available)
- Used for: Email verification, password reset, admin invites, notifications

---

## STEP 2: DATABASE TABLES (Create in Order)

### 2.1 Core Enums and Types
```sql
-- Role enum
CREATE TYPE app_role AS ENUM ('creator', 'normal_admin', 'admin', 'super_admin', 'owner');

-- Social account status enum
CREATE TYPE social_account_status AS ENUM ('pending_link', 'awaiting_code', 'verified', 'rejected');
```

### 2.2 User Management Tables (7 tables)
1. **founder_emails** - email (text, unique), created_at
2. **profiles** - user_id (uuid, FK to auth.users), username (unique), display_name, bio, avatar_url, cover_image_url, location, is_verified (default false), show_total_earned (default false), payment_details (jsonb), referred_by (uuid), is_new_admin (default false)
3. **profiles_public** - DATABASE VIEW (SELECT safe columns from profiles)
4. **user_roles** - user_id (uuid), role (app_role, default 'creator')
5. **user_suspensions** - user_id, campaign_id (nullable), reason, is_active (default true)
6. **user_follows** - follower_id, following_id
7. **user_memberships** - user_id, plan_id, status, billing_cycle, expires_at

### 2.3 Campaign System (3 tables)
8. **campaigns** - id, name, description, reward_per_1k_views (numeric), platforms (text[]), category, campaign_type ('ugc'/'clipping'), min_payout, max_payout, budget_total, budget_spent, affiliate_commission_percent, join_type ('direct'/'waitlist'), waitlist_questions (text[]), rules_guidelines, rules_link, thumbnail_url, status ('active'/'paused'/'completed'), created_by
9. **campaign_members** - user_id, campaign_id, status ('joined'), joined_at
10. **campaign_waitlist_requests** - user_id, campaign_id, answers (jsonb), status ('pending'/'approved'/'rejected'), admin_notes, reviewed_by, reviewed_at

### 2.4 Submissions and Earnings (3 tables)
11. **submissions** - user_id, campaign_id, video_url, social_link, status ('pending'/'approved'/'rejected'/'paid'), views_count, estimated_earnings, admin_notes, referrer_id
12. **balance_transactions** - user_id, amount, type ('pending_payout'/'deposit'/'withdrawal'/'deduction'/'affiliate_commission'/'referral_bonus'), status ('pending'/'available'/'paid'/'rejected'), campaign_id, submission_id, notes, release_date, processed_by
13. **payments** - user_id, submission_id, amount, status, payment_method, transaction_id

### 2.5 Affiliate System (2 tables)
14. **affiliate_links** - user_id, campaign_id, code (unique), clicks (default 0), signups (default 0), conversions (default 0)
15. **referral_rewards** - referrer_id, referred_user_id, amount (default 2.00), status, campaign_id, processed_by, processed_at

### 2.6 Social Accounts (2 tables)
16. **social_accounts** - user_id, platform, username, profile_url, verification_code, admin_code, status (social_account_status), is_verified, admin_notes
17. **social_accounts_public** - DATABASE VIEW (excludes verification codes)

### 2.7 Chat System (3 tables)
18. **chat_rooms** - id, type ('global'/'campaign'/'dm'), name, campaign_id
19. **chat_messages** - room_id, user_id, content - ENABLE REALTIME
20. **dm_participants** - room_id, user_id

### 2.8 Support System (3 tables)
21. **support_chats** - user_id, status, priority, last_message_at, unread_count, admin_unread_count
22. **support_messages** - chat_id, sender_id, sender_type ('user'/'admin'/'system'), content, is_read - ENABLE REALTIME
23. **support_config** - welcome_message, offline_message, auto_replies (jsonb), active_hours

### 2.9 Admin Features (3 tables)
24. **admin_activity_logs** - admin_id, action_type, target_type, target_id, action_details (jsonb)
25. **admin_invites** - email, invite_code (unique), invite_type ('normal_admin'/'super_admin'), status, expires_at, invited_by
26. **admin_campaign_assignments** - admin_id, campaign_id, assigned_by

### 2.10 Content Management (5 tables)
27. **announcements** - title, content, is_pinned, campaign_id (nullable), admin_id - ENABLE REALTIME
28. **legal_pages** - page_type ('privacy'/'terms'), title, content, last_updated_by
29. **company_pages** - page_type ('about'/'contact'/'careers'), title, content, meta_description, is_published
30. **faqs** - category, question, answer, is_active, sort_order
31. **footer_settings** - description, logo_url, twitter_url, instagram_url, youtube_url, tiktok_url, linkedin_url, facebook_url, terms_url, privacy_url, about_url, contact_url, careers_url

### 2.11 Notifications (2 tables)
32. **notifications** - user_id, type, title, message, is_read, metadata (jsonb) - ENABLE REALTIME
33. **email_verification_otps** - email, otp_code, expires_at (10 min), verified (default false)

### 2.12 Marketplace (5 tables)
34. **courses** - creator_id, title, description, short_description, price, original_price, category, thumbnail_url, status ('draft'/'published'), is_featured, rating, review_count, total_students, total_lessons, total_duration_minutes
35. **course_categories** - name, slug, icon, description, is_active, sort_order
36. **course_modules** - course_id, title, description, sort_order
37. **course_lessons** - module_id, title, description, video_url, content, duration_minutes, is_free_preview, sort_order
38. **course_enrollments** - user_id, course_id, progress_percent, completed_lessons (jsonb), payment_status, payment_amount, affiliate_id

### 2.13 Memberships (1 table)
39. **membership_plans** - name, description, price_monthly, price_yearly, features (jsonb), is_active, sort_order

---

## STEP 3: DATABASE TRIGGER (Critical!)

Create trigger to auto-create profile + role when user signs up:

```sql
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'displayName', 'New User')
  );

  -- Check if founder email
  IF EXISTS (SELECT 1 FROM public.founder_emails WHERE email = NEW.email) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'creator');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();
```

---

## STEP 4: RLS POLICIES (Security)

Enable RLS on ALL tables with these policies:
- **profiles**: Users view/update own, admins view/update all
- **campaigns**: Everyone views active, admins manage
- **submissions**: Users view own, admins view all
- **balance_transactions**: Users view own, admins manage
- **chat_messages**: Based on room membership
- **notifications**: Users view/update own only
- **admin_activity_logs**: Only owners can view
- **email_verification_otps**: Block all direct access (edge functions only)

---

## STEP 5: EDGE FUNCTIONS (11 Functions)

1. **send-verification-otp** - Send 6-digit OTP email (uses RESEND_API_KEY)
2. **verify-otp** - Verify OTP code
3. **passwordless-login** - OTP-based login, generate magic link
4. **reset-password-with-otp** - Reset password after OTP verification
5. **send-admin-invite** - Send admin invitation email
6. **accept-admin-invite** - Accept invite, assign role
7. **admin-reset-password** - Force password reset
8. **admin-manage-payment** - Process payments
9. **broadcast-email** - Mass email
10. **send-notification-email** - Individual notifications
11. **send-support-email** - Support tickets

---

## STEP 6: PAGES TO BUILD (21 Pages)

### Public Pages (13)
1. **Index (/)** - Hero, How It Works, Benefits, Stats, Affiliate CTA
2. **Auth (/auth)** - Login/Signup with OTP, Password Reset
3. **Campaigns (/campaigns)** - Grid with filters (category, type, platform)
4. **CampaignDetail (/campaigns/:id)** - Details, Join/Waitlist, Submit, Chat
5. **About (/about)** - Company info from company_pages
6. **Contact (/contact)** - Form + live chat
7. **Careers (/careers)** - Jobs from company_pages
8. **Terms (/terms)** - From legal_pages
9. **Privacy (/privacy)** - From legal_pages
10. **Support (/support)** - FAQs + live chat
11. **Pricing (/pricing)** - Membership plans
12. **Marketplace (/marketplace)** - Courses grid
13. **CourseDetail (/course/:id)** - Preview, modules, enroll

### Protected Pages (5)
14. **Dashboard (/dashboard)** - Stats overview
15. **Profile (/profile/:id?)** - Tabs (About, Campaigns, Submissions, Followers)
16. **Affiliate (/affiliate)** - Links, earnings, referrals
17. **Balance (/balance)** - Wallet, transactions, withdraw
18. **CreateCourse (/create-course)** - Course wizard

### Admin Pages (2)
19. **Admin (/admin)** - 20+ tabs
20. **Suspended (/suspended)** - Banned message

### Error
21. **NotFound (404)**

---

## STEP 7: ADMIN PANEL TABS (21 Sections)

1. Overview - Stats, charts
2. Campaigns - CRUD with thumbnail upload
3. Submissions - Approve (enter views), reject
4. Payments - Process payments
5. Withdrawals - Approve/reject
6. Users - Search, verify, ban
7. Social Accounts - Verify, send codes
8. Support Chats - Real-time
9. Support Settings - Messages config
10. Announcements - Create/manage
11. Admin Invites - Invite admins
12. Activity Logs - Owner only
13. Footer Settings - Social links
14. Legal Pages - Edit content
15. Company Pages - Edit content
16. FAQ Management - CRUD
17. Email Broadcast - Mass email
18. Membership Plans - CRUD
19. Waitlist Requests - Review
20. Affiliate Management - View all
21. Payout Management - Process

---

## STEP 8: KEY BUSINESS LOGIC

### Earnings Calculation
```javascript
earnings = (views_count / 1000) * campaign.reward_per_1k_views
if (campaign.max_payout) earnings = Math.min(earnings, max_payout)
```

### Referral Flow
1. User shares link: `zyrozo.com/auth?a=CODE`
2. New user signs up with referral code
3. Referrer gets $2 bonus in referral_rewards
4. Referrer gets commission on referred user's earnings

### Role Hierarchy
- **creator** - Default, can submit content
- **normal_admin** - Limited to assigned campaigns
- **admin** - Full admin access
- **super_admin** - Can manage admins
- **owner** - Can view activity logs

---

## STEP 9: STYLING THEME

### Colors
- Primary: #ea580c (Orange)
- Secondary: #db2777 (Pink)
- Background: #0a0a0a (Dark)
- Success: #10b981 (Green)

### Custom Classes
```css
.gradient-bg { background: linear-gradient(to right, #ea580c, #db2777); }
.gradient-text { background: linear-gradient(to right, #ea580c, #db2777); -webkit-background-clip: text; color: transparent; }
.glass-card { background: rgba(var(--card), 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
```

### Fonts
- Headings: Orbitron
- Body: Inter

---

## STEP 10: BUILD ORDER

1. **Database Setup** - Create all 39+ tables with RLS
2. **Auth System** - OTP-based signup/login with edge functions
3. **Landing Page** - Index with all sections
4. **Auth Page** - Complete login/signup/reset flow
5. **Campaigns** - List + Detail pages
6. **Profile** - With all tabs
7. **Dashboard** - Stats overview
8. **Balance + Affiliate** - Earnings pages
9. **Admin Panel** - All 21 tabs
10. **Chat System** - Global, campaign, DM
11. **Support System** - Live chat
12. **Marketplace** - Courses

---

## IMPORTANT NOTES

1. **Lovable Cloud** - No external Supabase needed, everything included
2. **RESEND_API_KEY** - Only required API key for emails
3. **Auth Auto-confirm** - Enable auto-confirm for email signups
4. **Realtime** - Enable for chat_messages, support_messages, notifications, announcements
5. **Loading States** - Always handle authLoading before redirecting
6. **Error Handling** - Use LoadingErrorState component with retry buttons

---

## BRANDING

- **Name:** Zyrozo
- **Domain:** zyrozo.com
- **Tagline:** "Your Content, Your Earnings"
- **Description:** India's #1 Creator Rewards Platform
- **Stats:** $500K+ Paid, 10M+ Views, 5K+ Creators, 100+ Campaigns

Start Database Setup
Build Auth System
Create Landing Page
Fix Current Project

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://earn-with-zyro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/43144405-0faf-4842-b3db-d6d58f14c844).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
