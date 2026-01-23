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
      agent_applications: {
        Row: {
          address: string | null
          admin_notes: string | null
          created_at: string
          description: string | null
          documents: string[] | null
          email: string | null
          id: string
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          travel_name: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          documents?: string[] | null
          email?: string | null
          id?: string
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          travel_name: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          documents?: string[] | null
          email?: string | null
          id?: string
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          travel_name?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      airlines: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          position: string
          priority: number
          start_date: string | null
          title: string
          travel_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          position?: string
          priority?: number
          start_date?: string | null
          title: string
          travel_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          position?: string
          priority?: number
          start_date?: string | null
          title?: string
          travel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
            referencedRelation: "travels"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          category: Database["public"]["Enums"]["checklist_category"]
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          phase: string
          priority: number
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["checklist_category"]
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          phase?: string
          priority?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["checklist_category"]
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          phase?: string
          priority?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          package_id: string | null
          price: number | null
          transaction_type: string
          travel_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          package_id?: string | null
          price?: number | null
          transaction_type: string
          travel_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          package_id?: string | null
          price?: number | null
          transaction_type?: string
          travel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
            referencedRelation: "travels"
            referencedColumns: ["id"]
          },
        ]
      }
      departures: {
        Row: {
          available_seats: number
          created_at: string
          departure_date: string
          id: string
          original_price: number | null
          package_id: string
          price: number
          return_date: string
          status: string | null
          total_seats: number
          updated_at: string
        }
        Insert: {
          available_seats?: number
          created_at?: string
          departure_date: string
          id?: string
          original_price?: number | null
          package_id: string
          price: number
          return_date: string
          status?: string | null
          total_seats?: number
          updated_at?: string
        }
        Update: {
          available_seats?: number
          created_at?: string
          departure_date?: string
          id?: string
          original_price?: number | null
          package_id?: string
          price?: number
          return_date?: string
          status?: string | null
          total_seats?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departures_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          city: string
          created_at: string
          distance_to_haram: string | null
          id: string
          is_active: boolean
          name: string
          star_rating: number
          updated_at: string
        }
        Insert: {
          city?: string
          created_at?: string
          distance_to_haram?: string | null
          id?: string
          is_active?: boolean
          name: string
          star_rating?: number
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          distance_to_haram?: string | null
          id?: string
          is_active?: boolean
          name?: string
          star_rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      journal_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          journal_id: string
          order_index: number
          photo_url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          journal_id: string
          order_index?: number
          photo_url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          journal_id?: string
          order_index?: number
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_photos_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journals"
            referencedColumns: ["id"]
          },
        ]
      }
      journals: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_public: boolean
          latitude: number | null
          location_name: string | null
          longitude: number | null
          mood: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          mood?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          mood?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          amount: number
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          payment_proof_url: string | null
          plan_type: string
          start_date: string | null
          status: string
          travel_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_proof_url?: string | null
          plan_type?: string
          start_date?: string | null
          status?: string
          travel_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_proof_url?: string | null
          plan_type?: string
          start_date?: string | null
          status?: string
          travel_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
            referencedRelation: "travels"
            referencedColumns: ["id"]
          },
        ]
      }
      package_credits: {
        Row: {
          created_at: string
          credits_remaining: number
          credits_used: number
          id: string
          last_purchase_date: string | null
          travel_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          id?: string
          last_purchase_date?: string | null
          travel_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          id?: string
          last_purchase_date?: string | null
          travel_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_credits_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: true
            referencedRelation: "travels"
            referencedColumns: ["id"]
          },
        ]
      }
      package_interests: {
        Row: {
          created_at: string
          departure_id: string | null
          id: string
          interest_type: string
          package_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          departure_id?: string | null
          id?: string
          interest_type?: string
          package_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          departure_id?: string | null
          id?: string
          interest_type?: string
          package_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_interests_departure_id_fkey"
            columns: ["departure_id"]
            isOneToOne: false
            referencedRelation: "departures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_interests_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          airline: string | null
          created_at: string
          description: string | null
          duration_days: number
          facilities: string[] | null
          flight_type: string | null
          hotel_madinah: string | null
          hotel_makkah: string | null
          hotel_star: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          meal_type: string | null
          name: string
          travel_id: string
          updated_at: string
        }
        Insert: {
          airline?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          facilities?: string[] | null
          flight_type?: string | null
          hotel_madinah?: string | null
          hotel_makkah?: string | null
          hotel_star?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          meal_type?: string | null
          name: string
          travel_id: string
          updated_at?: string
        }
        Update: {
          airline?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          facilities?: string[] | null
          flight_type?: string | null
          hotel_madinah?: string | null
          hotel_makkah?: string | null
          hotel_star?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          meal_type?: string | null
          name?: string
          travel_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
            referencedRelation: "travels"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      prayer_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          name_arabic: string | null
          priority: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_arabic?: string | null
          priority?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_arabic?: string | null
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      prayers: {
        Row: {
          arabic_text: string
          audio_url: string | null
          benefits: string | null
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          priority: number
          source: string | null
          title: string
          title_arabic: string | null
          translation: string | null
          transliteration: string | null
          updated_at: string
        }
        Insert: {
          arabic_text: string
          audio_url?: string | null
          benefits?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          source?: string | null
          title: string
          title_arabic?: string | null
          translation?: string | null
          transliteration?: string | null
          updated_at?: string
        }
        Update: {
          arabic_text?: string
          audio_url?: string | null
          benefits?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          source?: string | null
          title?: string
          title_arabic?: string | null
          translation?: string | null
          transliteration?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "prayer_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_suspended: boolean
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      travel_reviews: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          is_published: boolean | null
          is_verified_purchase: boolean | null
          rating: number
          review_text: string | null
          travel_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          is_verified_purchase?: boolean | null
          rating: number
          review_text?: string | null
          travel_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          is_verified_purchase?: boolean | null
          rating?: number
          review_text?: string | null
          travel_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_reviews_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
            referencedRelation: "travels"
            referencedColumns: ["id"]
          },
        ]
      }
      travels: {
        Row: {
          address: string | null
          approval_notes: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          rating: number | null
          review_count: number | null
          status: string
          updated_at: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          approval_notes?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          status?: string
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          approval_notes?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          status?: string
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_checklists: {
        Row: {
          checked_at: string | null
          checklist_id: string
          created_at: string
          id: string
          is_checked: boolean
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_at?: string | null
          checklist_id: string
          created_at?: string
          id?: string
          is_checked?: boolean
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_at?: string | null
          checklist_id?: string
          created_at?: string
          id?: string
          is_checked?: boolean
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_checklists_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_departure: {
        Args: { _departure_id: string; _user_id: string }
        Returns: boolean
      }
      owns_package: {
        Args: { _package_id: string; _user_id: string }
        Returns: boolean
      }
      owns_travel: {
        Args: { _travel_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "jamaah" | "agent" | "admin"
      checklist_category: "dokumen" | "perlengkapan" | "kesehatan" | "mental"
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
      app_role: ["jamaah", "agent", "admin"],
      checklist_category: ["dokumen", "perlengkapan", "kesehatan", "mental"],
    },
  },
} as const
