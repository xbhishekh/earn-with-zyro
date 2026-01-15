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
          status: string | null
          thumbnail_url: string | null
          updated_at: string
          waitlist_questions: string[] | null
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
          status?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          waitlist_questions?: string[] | null
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
          status?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          waitlist_questions?: string[] | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "creator" | "normal_admin" | "admin" | "super_admin" | "owner"
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
    },
  },
} as const
