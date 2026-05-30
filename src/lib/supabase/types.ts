export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      content_reports: {
        Row: {
          actioned_by: string | null
          created_at: string
          id: string
          reaction_id: string | null
          reason: string
          reporter_ip_hash: string | null
          reporter_user_id: string | null
          space_id: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          actioned_by?: string | null
          created_at?: string
          id?: string
          reaction_id?: string | null
          reason: string
          reporter_ip_hash?: string | null
          reporter_user_id?: string | null
          space_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          actioned_by?: string | null
          created_at?: string
          id?: string
          reaction_id?: string | null
          reason?: string
          reporter_ip_hash?: string | null
          reporter_user_id?: string | null
          space_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reaction_id_fkey"
            columns: ["reaction_id"]
            isOneToOne: false
            referencedRelation: "reactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          action_type: Database["public"]["Enums"]["credit_action"]
          balance_after: number
          created_at: string
          delta: number
          id: string
          note: string | null
          space_id: string | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["credit_action"]
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          note?: string | null
          space_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["credit_action"]
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          note?: string | null
          space_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          created_at: string
          id: string
          ip_country: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_country?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_country?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moderation_items: {
        Row: {
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          space_id: string
          status: Database["public"]["Enums"]["moderation_status"]
          submitted_at: string
        }
        Insert: {
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          space_id: string
          status?: Database["public"]["Enums"]["moderation_status"]
          submitted_at?: string
        }
        Update: {
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          space_id?: string
          status?: Database["public"]["Enums"]["moderation_status"]
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_items_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: true
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          ai_prompts_enabled: boolean
          announcement_banner: string | null
          gallery_enabled: boolean
          id: number
          maintenance_message: string
          maintenance_mode: boolean
          new_signups_enabled: boolean
          og_cards_enabled: boolean
          reaction_notifications_enabled: boolean
          reactions_enabled: boolean
          resend_from_name: string
          resend_reply_to: string
          updated_at: string
          weekly_digest_enabled: boolean
        }
        Insert: {
          ai_prompts_enabled?: boolean
          announcement_banner?: string | null
          gallery_enabled?: boolean
          id?: number
          maintenance_message?: string
          maintenance_mode?: boolean
          new_signups_enabled?: boolean
          og_cards_enabled?: boolean
          reaction_notifications_enabled?: boolean
          reactions_enabled?: boolean
          resend_from_name?: string
          resend_reply_to?: string
          updated_at?: string
          weekly_digest_enabled?: boolean
        }
        Update: {
          ai_prompts_enabled?: boolean
          announcement_banner?: string | null
          gallery_enabled?: boolean
          id?: number
          maintenance_message?: string
          maintenance_mode?: boolean
          new_signups_enabled?: boolean
          og_cards_enabled?: boolean
          reaction_notifications_enabled?: boolean
          reactions_enabled?: boolean
          resend_from_name?: string
          resend_reply_to?: string
          updated_at?: string
          weekly_digest_enabled?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credit_balance: number
          credits_expiry_at: string | null
          credits_monthly_cap: number
          display_name: string | null
          email: string
          id: string
          role: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          credit_balance?: number
          credits_expiry_at?: string | null
          credits_monthly_cap?: number
          display_name?: string | null
          email: string
          id?: string
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          credit_balance?: number
          credits_expiry_at?: string | null
          credits_monthly_cap?: number
          display_name?: string | null
          email?: string
          id?: string
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      prompt_log: {
        Row: {
          accepted: boolean | null
          credits_charged: number
          id: string
          prompt_text: string | null
          shown_at: string
          space_id: string
        }
        Insert: {
          accepted?: boolean | null
          credits_charged?: number
          id?: string
          prompt_text?: string | null
          shown_at?: string
          space_id: string
        }
        Update: {
          accepted?: boolean | null
          credits_charged?: number
          id?: string
          prompt_text?: string | null
          shown_at?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_log_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          notes: string | null
          system_text: string
          user_text: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          notes?: string | null
          system_text: string
          user_text: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          notes?: string | null
          system_text?: string
          user_text?: string
          version?: number
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          message: string
          space_id: string
          visitor_ip_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          message: string
          space_id: string
          visitor_ip_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          message?: string
          space_id?: string
          visitor_ip_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          content_json: Json | null
          created_at: string
          design_tokens: Json | null
          display_name: string | null
          gallery_status: Database["public"]["Enums"]["gallery_status"]
          gallery_tags: string[]
          id: string
          is_primary: boolean
          og_image_url: string | null
          published_at: string | null
          reactions_enabled: boolean
          slug: string
          theme_version: number
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["space_visibility"]
        }
        Insert: {
          content_json?: Json | null
          created_at?: string
          design_tokens?: Json | null
          display_name?: string | null
          gallery_status?: Database["public"]["Enums"]["gallery_status"]
          gallery_tags?: string[]
          id?: string
          is_primary?: boolean
          og_image_url?: string | null
          published_at?: string | null
          reactions_enabled?: boolean
          slug: string
          theme_version?: number
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["space_visibility"]
        }
        Update: {
          content_json?: Json | null
          created_at?: string
          design_tokens?: Json | null
          display_name?: string | null
          gallery_status?: Database["public"]["Enums"]["gallery_status"]
          gallery_tags?: string[]
          id?: string
          is_primary?: boolean
          og_image_url?: string | null
          published_at?: string | null
          reactions_enabled?: boolean
          slug?: string
          theme_version?: number
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["space_visibility"]
        }
        Relationships: []
      }
      username_blocklist: {
        Row: {
          added_at: string
          note: string | null
          username: string
        }
        Insert: {
          added_at?: string
          note?: string | null
          username: string
        }
        Update: {
          added_at?: string
          note?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_credits: {
        Args: {
          p_action: Database["public"]["Enums"]["credit_action"]
          p_delta: number
          p_note?: string
          p_space_id?: string
          p_user_id: string
        }
        Returns: number
      }
      grant_credits: {
        Args: {
          p_action: Database["public"]["Enums"]["credit_action"]
          p_cap?: number
          p_delta: number
          p_note?: string
          p_stripe_id?: string
          p_user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      credit_action:
        | "signup_gift"
        | "subscription_renewal"
        | "purchase"
        | "generation"
        | "regeneration"
        | "prompt"
        | "og_regen"
        | "bonus_admin"
        | "refund"
      gallery_status: "not_submitted" | "pending" | "approved" | "rejected"
      moderation_status: "pending" | "approved" | "rejected" | "re_review"
      report_status: "pending" | "dismissed" | "actioned"
      space_visibility: "private" | "link_only" | "public"
      subscription_status: "free" | "active" | "cancelled" | "past_due"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      credit_action: [
        "signup_gift",
        "subscription_renewal",
        "purchase",
        "generation",
        "regeneration",
        "prompt",
        "og_regen",
        "bonus_admin",
        "refund",
      ],
      gallery_status: ["not_submitted", "pending", "approved", "rejected"],
      moderation_status: ["pending", "approved", "rejected", "re_review"],
      report_status: ["pending", "dismissed", "actioned"],
      space_visibility: ["private", "link_only", "public"],
      subscription_status: ["free", "active", "cancelled", "past_due"],
    },
  },
} as const

