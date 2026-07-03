// GENERATED — do not edit by hand.
// Regenerate: Supabase MCP `generate_typescript_types` (or `supabase gen types typescript`).
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
      ingredient_hazards: {
        Row: {
          aliases: string[]
          authority: string
          classification: string
          created_at: string
          e_number: string | null
          id: string
          ingredient: string
          jurisdiction: string
          kind: string
          severity: string
          source_url: string
          verbatim_quote: string
          verified_at: string | null
        }
        Insert: {
          aliases?: string[]
          authority: string
          classification: string
          created_at?: string
          e_number?: string | null
          id?: string
          ingredient: string
          jurisdiction: string
          kind: string
          severity: string
          source_url: string
          verbatim_quote: string
          verified_at?: string | null
        }
        Update: {
          aliases?: string[]
          authority?: string
          classification?: string
          created_at?: string
          e_number?: string | null
          id?: string
          ingredient?: string
          jurisdiction?: string
          kind?: string
          severity?: string
          source_url?: string
          verbatim_quote?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string
          brand: string | null
          cached_at: string
          ingredients_raw: string | null
          name: string | null
          source: string
        }
        Insert: {
          barcode: string
          brand?: string | null
          cached_at?: string
          ingredients_raw?: string | null
          name?: string | null
          source: string
        }
        Update: {
          barcode?: string
          brand?: string | null
          cached_at?: string
          ingredients_raw?: string | null
          name?: string | null
          source?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          conditions: string[]
          created_at: string
          id: string
          is_premium: boolean
        }
        Insert: {
          conditions?: string[]
          created_at?: string
          id: string
          is_premium?: boolean
        }
        Update: {
          conditions?: string[]
          created_at?: string
          id?: string
          is_premium?: boolean
        }
        Relationships: []
      }
      recalls: {
        Row: {
          created_at: string
          date: string
          id: string
          match_barcode: string | null
          match_brand: string | null
          match_product: string | null
          official_url: string
          severity: string
          source: string
          title: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          match_barcode?: string | null
          match_brand?: string | null
          match_product?: string | null
          official_url: string
          severity?: string
          source: string
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          match_barcode?: string | null
          match_brand?: string | null
          match_product?: string | null
          official_url?: string
          severity?: string
          source?: string
          title?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["barcode"]
          },
          {
            foreignKeyName: "scans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["barcode"]
          },
        ]
      }
      verdicts: {
        Row: {
          created_at: string
          flags: Json
          id: string
          model: string | null
          product_id: string
          rating: number
          summary_bm: string | null
          summary_en: string | null
          verdict: string
        }
        Insert: {
          created_at?: string
          flags?: Json
          id?: string
          model?: string | null
          product_id: string
          rating: number
          summary_bm?: string | null
          summary_en?: string | null
          verdict: string
        }
        Update: {
          created_at?: string
          flags?: Json
          id?: string
          model?: string | null
          product_id?: string
          rating?: number
          summary_bm?: string | null
          summary_en?: string | null
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "verdicts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "feed_items"
            referencedColumns: ["barcode"]
          },
          {
            foreignKeyName: "verdicts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["barcode"]
          },
        ]
      }
    }
    Views: {
      feed_items: {
        Row: {
          band: string | null
          barcode: string | null
          brand: string | null
          flagged_count: number | null
          name: string | null
          rating: number | null
          recalled: boolean | null
          scanned_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
