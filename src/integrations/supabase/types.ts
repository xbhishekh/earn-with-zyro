export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_campaign_assignments: {
        Row: {
          admin_user_id: string
          assigned_at: string | null
          assigned_by: string
          campaign_id: string
          id: string
        }
        Insert: {
          admin_user_id: string
          assigned_at?: string | null
          assigned_by: string
          campaign_id: string
          id?: string
        }
        Update: {
          admin_user_id?: string
          assigned_at?: string | null
          assigned_by?: string
          campaign_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_campaign_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invite_code: string
          invite_type: Database["public"]["Enums"]["app_role"]
          invited_by: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invite_code: string
          invite_type?: Database["public"]["Enums"]["app_role"]
          invited_by: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          invite_type?: Database["public"]["Enums"]["app_role"]
          invited_by?: string
          status?: string | null
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          campaign_id: string | null
          clicks: number | null
          code: string
          conversions: number | null
          created_at: string | null
          id: string
          signups: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number | null
          code: string
          conversions?: number | null
          created_at?: string | null
          id?: string
          signups?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          clicks?: number | null
          code?: string
          conversions?: number | null
          created_at?: string | null
          id?: string
          signups?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          admin_id: string
          campaign_id: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          campaign_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          campaign_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_transactions: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          release_date: string | null
          status: string | null
          submission_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          release_date?: string | null
          status?: string | null
          submission_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          release_date?: string | null
          status?: string | null
          submission_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_assets: {
        Row: {
          asset_type: string
          campaign_id: string
          created_at: string
          description: string | null
          file_name: string | null
          file_size: number | null
          id: string
          is_required: boolean | null
          sort_order: number | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          asset_type: string
          campaign_id: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          asset_type?: string
          campaign_id?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_members: {
        Row: {
          campaign_id: string
          id: string
          joined_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_waitlist_requests: {
        Row: {
          admin_notes: string | null
          answers: string[] | null
          campaign_id: string
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          answers?: string[] | null
          campaign_id: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          answers?: string[] | null
          campaign_id?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_waitlist_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          affiliate_commission_percent: number | null
          budget_spent: number | null
          budget_total: number | null
          campaign_type: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          join_type: string | null
          max_payout: number | null
          min_payout: number | null
          name: string
          platforms: string[] | null
          reward_per_1k_views: number
          rules_guidelines: string | null
          rules_link: string | null
          slug: string | null
          status: string | null
          thumbnail_url: string | null
          updated_at: string
          video_url: string | null
          waitlist_questions: string[] | null
          welcome_message: string | null
        }
        Insert: {
          affiliate_commission_percent?: number | null
          budget_spent?: number | null
          budget_total?: number | null
          campaign_type?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          join_type?: string | null
          max_payout?: number | null
          min_payout?: number | null
          name: string
          platforms?: string[] | null
          reward_per_1k_views?: number
          rules_guidelines?: string | null
          rules_link?: string | null
          slug?: string | null
          status?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          video_url?: string | null
          waitlist_questions?: string[] | null
          welcome_message?: string | null
        }
        Update: {
          affiliate_commission_percent?: number | null
          budget_spent?: number | null
          budget_total?: number | null
          campaign_type?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          join_type?: string | null
          max_payout?: number | null
          min_payout?: number | null
          name?: string
          platforms?: string[] | null
          reward_per_1k_views?: number
          rules_guidelines?: string | null
          rules_link?: string | null
          slug?: string | null
          status?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          video_url?: string | null
          waitlist_questions?: string[] | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      chat_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          reply_to_id: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          reply_to_id?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          reply_to_id?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string
          name: string | null
          type: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          type: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      company_pages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          last_updated_by: string | null
          meta_description: string | null
          page_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          last_updated_by?: string | null
          meta_description?: string | null
          page_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          last_updated_by?: string | null
          meta_description?: string | null
          page_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase_amount: number | null
          product_id: string | null
          seller_id: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          product_id?: string | null
          seller_id: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          product_id?: string | null
          seller_id?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_participants: {
        Row: {
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          category: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      footer_settings: {
        Row: {
          about_url: string | null
          careers_url: string | null
          contact_url: string | null
          created_at: string | null
          description: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          logo_url: string | null
          privacy_url: string | null
          terms_url: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          about_url?: string | null
          careers_url?: string | null
          contact_url?: string | null
          created_at?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          privacy_url?: string | null
          terms_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          about_url?: string | null
          careers_url?: string | null
          contact_url?: string | null
          created_at?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          privacy_url?: string | null
          terms_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          last_updated_by: string | null
          page_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          last_updated_by?: string | null
          page_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          last_updated_by?: string | null
          page_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketplace_products: {
        Row: {
          category: string
          created_at: string | null
          currency: string | null
          description: string | null
          faqs: Json | null
          features: string[] | null
          gallery_images: string[] | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          members_count: number | null
          price: number | null
          product_type: string
          seller_id: string
          short_description: string | null
          slug: string | null
          subscription_interval: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          faqs?: Json | null
          features?: string[] | null
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          members_count?: number | null
          price?: number | null
          product_type?: string
          seller_id: string
          short_description?: string | null
          slug?: string | null
          subscription_interval?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          faqs?: Json | null
          features?: string[] | null
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          members_count?: number | null
          price?: number | null
          product_type?: string
          seller_id?: string
          short_description?: string | null
          slug?: string | null
          subscription_interval?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_method: string | null
          status: string | null
          submission_id: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          submission_id?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          submission_id?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_purchases: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string | null
          discount_amount: number | null
          discount_code_id: string | null
          id: string
          original_price: number | null
          payment_method: string
          product_id: string
          seller_id: string
          status: string | null
          subscription_ends_at: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          id?: string
          original_price?: number | null
          payment_method: string
          product_id: string
          seller_id: string
          status?: string | null
          subscription_ends_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          id?: string
          original_price?: number | null
          payment_method?: string
          product_id?: string
          seller_id?: string
          status?: string | null
          subscription_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_purchases_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string | null
          id: string
          is_verified_purchase: boolean | null
          product_id: string
          rating: number
          review_text: string | null
          reviewer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean | null
          product_id: string
          rating: number
          review_text?: string | null
          reviewer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean | null
          product_id?: string
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_verified: boolean | null
          location: string | null
          payment_details: Json | null
          referred_by: string | null
          show_joined_products: boolean | null
          show_location: boolean | null
          show_owned_products: boolean | null
          show_total_earned: boolean | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          payment_details?: Json | null
          referred_by?: string | null
          show_joined_products?: boolean | null
          show_location?: boolean | null
          show_owned_products?: boolean | null
          show_total_earned?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          payment_details?: Json | null
          referred_by?: string | null
          show_joined_products?: boolean | null
          show_location?: boolean | null
          show_owned_products?: boolean | null
          show_total_earned?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          amount: number | null
          campaign_id: string | null
          created_at: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          referred_user_id: string
          referrer_id: string
          status: string | null
        }
        Insert: {
          amount?: number | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          referred_user_id: string
          referrer_id: string
          status?: string | null
        }
        Update: {
          amount?: number | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          referred_user_id?: string
          referrer_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          admin_code: string | null
          admin_notes: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          platform: string
          profile_url: string | null
          status: Database["public"]["Enums"]["social_account_status"] | null
          updated_at: string | null
          user_id: string
          username: string | null
          verification_code: string | null
          verified_at: string | null
        }
        Insert: {
          admin_code?: string | null
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          platform: string
          profile_url?: string | null
          status?: Database["public"]["Enums"]["social_account_status"] | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          verification_code?: string | null
          verified_at?: string | null
        }
        Update: {
          admin_code?: string | null
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          platform?: string
          profile_url?: string | null
          status?: Database["public"]["Enums"]["social_account_status"] | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          verification_code?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          admin_notes: string | null
          campaign_id: string
          created_at: string
          estimated_earnings: number | null
          id: string
          referrer_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_link: string | null
          status: string | null
          updated_at: string
          user_id: string
          video_url: string
          views_count: number | null
        }
        Insert: {
          admin_notes?: string | null
          campaign_id: string
          created_at?: string
          estimated_earnings?: number | null
          id?: string
          referrer_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_link?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          video_url: string
          views_count?: number | null
        }
        Update: {
          admin_notes?: string | null
          campaign_id?: string
          created_at?: string
          estimated_earnings?: number | null
          id?: string
          referrer_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_link?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_chats: {
        Row: {
          admin_unread_count: number | null
          created_at: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          priority: string | null
          status: string | null
          unread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_unread_count?: number | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          priority?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_unread_count?: number | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          priority?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_config: {
        Row: {
          active_hours_end: string | null
          active_hours_start: string | null
          auto_replies: Json | null
          created_at: string | null
          id: string
          offline_message: string | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          active_hours_end?: string | null
          active_hours_start?: string | null
          auto_replies?: Json | null
          created_at?: string | null
          id?: string
          offline_message?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          active_hours_end?: string | null
          active_hours_start?: string | null
          auto_replies?: Json | null
          created_at?: string | null
          id?: string
          offline_message?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
          sender_type: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_suspensions: {
        Row: {
          campaign_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          reason: string | null
          suspended_at: string | null
          suspended_by: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          suspended_at?: string | null
          suspended_by: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          suspended_at?: string | null
          suspended_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_suspensions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          id: string
          payment_details: Json
          payment_method: string
          processed_at: string | null
          processed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          id?: string
          payment_details: Json
          payment_method: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          payment_details?: Json
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_support_chat: { Args: { chat_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_affiliate_clicks: {
        Args: { link_code: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "creator" | "normal_admin" | "admin" | "super_admin" | "owner"
      social_account_status:
        | "pending_link"
        | "awaiting_code"
        | "verified"
        | "rejected"
        | "pending_verification"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["creator", "normal_admin", "admin", "super_admin", "owner"],
      social_account_status: [
        "pending_link",
        "awaiting_code",
        "verified",
        "rejected",
        "pending_verification",
      ],
    },
  },
} as const
