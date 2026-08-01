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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chain_test_prices: {
        Row: {
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_available: boolean
          lab_chain_id: string
          medical_test_id: string
          notes: string | null
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_available?: boolean
          lab_chain_id: string
          medical_test_id: string
          notes?: string | null
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_available?: boolean
          lab_chain_id?: string
          medical_test_id?: string
          notes?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chain_test_prices_lab_chain_id_fkey"
            columns: ["lab_chain_id"]
            isOneToOne: false
            referencedRelation: "lab_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_test_prices_medical_test_id_fkey"
            columns: ["medical_test_id"]
            isOneToOne: false
            referencedRelation: "medical_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_centers: {
        Row: {
          address: string
          branch_name: string
          city: string
          contact_phone: string
          created_at: string
          home_sample_available: boolean
          home_sample_override: boolean | null
          id: string
          is_active: boolean
          lab_chain_id: string | null
          latitude: number
          longitude: number
          name: string
          sample_collection_fee: number
          sample_collection_fee_override: number | null
          slug: string
          sort_order: number
          thana: string
          updated_at: string
        }
        Insert: {
          address?: string
          branch_name?: string
          city?: string
          contact_phone?: string
          created_at?: string
          home_sample_available?: boolean
          home_sample_override?: boolean | null
          id?: string
          is_active?: boolean
          lab_chain_id?: string | null
          latitude?: number
          longitude?: number
          name: string
          sample_collection_fee?: number
          sample_collection_fee_override?: number | null
          slug: string
          sort_order?: number
          thana?: string
          updated_at?: string
        }
        Update: {
          address?: string
          branch_name?: string
          city?: string
          contact_phone?: string
          created_at?: string
          home_sample_available?: boolean
          home_sample_override?: boolean | null
          id?: string
          is_active?: boolean
          lab_chain_id?: string | null
          latitude?: number
          longitude?: number
          name?: string
          sample_collection_fee?: number
          sample_collection_fee_override?: number | null
          slug?: string
          sort_order?: number
          thana?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_centers_lab_chain_id_fkey"
            columns: ["lab_chain_id"]
            isOneToOne: false
            referencedRelation: "lab_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_chains: {
        Row: {
          cons: string[]
          created_at: string
          default_home_sample_available: boolean
          default_sample_collection_fee: number
          description: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          pros: string[]
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          cons?: string[]
          created_at?: string
          default_home_sample_available?: boolean
          default_sample_collection_fee?: number
          description?: string
          id?: string
          is_active?: boolean
          logo_url?: string
          name: string
          pros?: string[]
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          cons?: string[]
          created_at?: string
          default_home_sample_available?: boolean
          default_sample_collection_fee?: number
          description?: string
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          pros?: string[]
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      medical_tests: {
        Row: {
          bangla_name: string
          canonical_name: string
          category: string
          code: string
          consumable_fee: number
          created_at: string
          description: string
          fasting_hours: number | null
          fasting_required: boolean
          id: string
          is_active: boolean
          is_government_rate: boolean
          is_popular: boolean
          preparation_note: string
          report_delivery_hrs: number
          sort_order: number
          synonyms: string[]
          updated_at: string
        }
        Insert: {
          bangla_name?: string
          canonical_name: string
          category?: string
          code: string
          consumable_fee?: number
          created_at?: string
          description?: string
          fasting_hours?: number | null
          fasting_required?: boolean
          id?: string
          is_active?: boolean
          is_government_rate?: boolean
          is_popular?: boolean
          preparation_note?: string
          report_delivery_hrs?: number
          sort_order?: number
          synonyms?: string[]
          updated_at?: string
        }
        Update: {
          bangla_name?: string
          canonical_name?: string
          category?: string
          code?: string
          consumable_fee?: number
          created_at?: string
          description?: string
          fasting_hours?: number | null
          fasting_required?: boolean
          id?: string
          is_active?: boolean
          is_government_rate?: boolean
          is_popular?: boolean
          preparation_note?: string
          report_delivery_hrs?: number
          sort_order?: number
          synonyms?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone_number: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone_number: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone_number?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          billing_id: string
          created_at: string
          diagnostic_center_id: string | null
          flagged_reason: string | null
          id: string
          lab_chain_id: string
          phone_number: string
          phone_verified_at: string | null
          rating: number
          review_text: string
          reviewer_name: string
          status: string
          test_name: string | null
          updated_at: string
        }
        Insert: {
          billing_id: string
          created_at?: string
          diagnostic_center_id?: string | null
          flagged_reason?: string | null
          id?: string
          lab_chain_id: string
          phone_number: string
          phone_verified_at?: string | null
          rating: number
          review_text: string
          reviewer_name?: string
          status?: string
          test_name?: string | null
          updated_at?: string
        }
        Update: {
          billing_id?: string
          created_at?: string
          diagnostic_center_id?: string | null
          flagged_reason?: string | null
          id?: string
          lab_chain_id?: string
          phone_number?: string
          phone_verified_at?: string | null
          rating?: number
          review_text?: string
          reviewer_name?: string
          status?: string
          test_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_diagnostic_center_id_fkey"
            columns: ["diagnostic_center_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_lab_chain_id_fkey"
            columns: ["lab_chain_id"]
            isOneToOne: false
            referencedRelation: "lab_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      test_prices: {
        Row: {
          created_at: string
          diagnostic_center_id: string
          discount_type: string
          discount_value: number
          discounted_price: number | null
          id: string
          is_available: boolean
          medical_test_id: string
          notes: string | null
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnostic_center_id: string
          discount_type?: string
          discount_value?: number
          discounted_price?: number | null
          id?: string
          is_available?: boolean
          medical_test_id: string
          notes?: string | null
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnostic_center_id?: string
          discount_type?: string
          discount_value?: number
          discounted_price?: number | null
          id?: string
          is_available?: boolean
          medical_test_id?: string
          notes?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_prices_diagnostic_center_id_fkey"
            columns: ["diagnostic_center_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_prices_medical_test_id_fkey"
            columns: ["medical_test_id"]
            isOneToOne: false
            referencedRelation: "medical_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      thanas: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
