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
      agent_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          notification_type: string
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          travel_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          travel_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          travel_id?: string
        }
        Relationships: []
      }
      agent_website_settings: {
        Row: {
          admin_notes: string | null
          created_at: string
          css_content: string | null
          custom_slug: string | null
          fb_pixel_id: string | null
          google_analytics_id: string | null
          html_content: string | null
          is_builder_active: boolean | null
          is_pro_active: boolean | null
          js_content: string | null
          meta_description: string | null
          meta_title: string | null
          slug: string | null
          slug_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          css_content?: string | null
          custom_slug?: string | null
          fb_pixel_id?: string | null
          google_analytics_id?: string | null
          html_content?: string | null
          is_builder_active?: boolean | null
          is_pro_active?: boolean | null
          js_content?: string | null
          meta_description?: string | null
          meta_title?: string | null
          slug?: string | null
          slug_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          css_content?: string | null
          custom_slug?: string | null
          fb_pixel_id?: string | null
          google_analytics_id?: string | null
          html_content?: string | null
          is_builder_active?: boolean | null
          is_pro_active?: boolean | null
          js_content?: string | null
          meta_description?: string | null
          meta_title?: string | null
          slug?: string | null
          slug_status?: string | null
          updated_at?: string
          user_id?: string
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
      bookings: {
        Row: {
          agent_notes: string | null
          booking_code: string
          contact_email: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          departure_id: string | null
          departure_reminder_h0: boolean | null
          departure_reminder_h1: boolean | null
          departure_reminder_h14: boolean | null
          departure_reminder_h3: boolean | null
          departure_reminder_h30: boolean | null
          departure_reminder_h7: boolean | null
          id: string
          notes: string | null
          number_of_pilgrims: number
          package_id: string
          paid_amount: number
          remaining_amount: number | null
          status: string
          total_price: number
          travel_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_notes?: string | null
          booking_code: string
          contact_email?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string
          departure_id?: string | null
          departure_reminder_h0?: boolean | null
          departure_reminder_h1?: boolean | null
          departure_reminder_h14?: boolean | null
          departure_reminder_h3?: boolean | null
          departure_reminder_h30?: boolean | null
          departure_reminder_h7?: boolean | null
          id?: string
          notes?: string | null
          number_of_pilgrims?: number
          package_id: string
          paid_amount?: number
          remaining_amount?: number | null
          status?: string
          total_price: number
          travel_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_notes?: string | null
          booking_code?: string
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          departure_id?: string | null
          departure_reminder_h0?: boolean | null
          departure_reminder_h1?: boolean | null
          departure_reminder_h14?: boolean | null
          departure_reminder_h3?: boolean | null
          departure_reminder_h30?: boolean | null
          departure_reminder_h7?: boolean | null
          id?: string
          notes?: string | null
          number_of_pilgrims?: number
          package_id?: string
          paid_amount?: number
          remaining_amount?: number | null
          status?: string
          total_price?: number
          travel_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_departure_id_fkey"
            columns: ["departure_id"]
            isOneToOne: false
            referencedRelation: "departures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
            referencedRelation: "travels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          sender_id: string
          sender_type: string
          travel_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          sender_id: string
          sender_type: string
          travel_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          travel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
            referencedRelation: "travels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_notifications: {
        Row: {
          chat_message_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message_preview: string | null
          seller_id: string
          sender_name: string | null
          user_id: string
        }
        Insert: {
          chat_message_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_preview?: string | null
          seller_id: string
          sender_name?: string | null
          user_id: string
        }
        Update: {
          chat_message_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_preview?: string | null
          seller_id?: string
          sender_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_notifications_chat_message_id_fkey"
            columns: ["chat_message_id"]
            isOneToOne: false
            referencedRelation: "shop_chat_messages"
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
      content_ratings: {
        Row: {
          comment: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
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
      departure_notification_logs: {
        Row: {
          body: string
          booking_id: string | null
          id: string
          is_read: boolean | null
          notification_type: string
          read_at: string | null
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          booking_id?: string | null
          id?: string
          is_read?: boolean | null
          notification_type: string
          read_at?: string | null
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          booking_id?: string | null
          id?: string
          is_read?: boolean | null
          notification_type?: string
          read_at?: string | null
          sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departure_notification_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
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
      dzikir_types: {
        Row: {
          category: string | null
          created_at: string
          default_target: number | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_arabic: string | null
          priority: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_target?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_arabic?: string | null
          priority?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_target?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_arabic?: string | null
          priority?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      exercise_types: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          icon: string | null
          id: string
          intensity: string
          is_active: boolean | null
          is_ramadan_friendly: boolean | null
          name: string
          priority: number | null
          recommended_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          intensity?: string
          is_active?: boolean | null
          is_ramadan_friendly?: boolean | null
          name: string
          priority?: number | null
          recommended_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          intensity?: string
          is_active?: boolean | null
          is_ramadan_friendly?: boolean | null
          name?: string
          priority?: number | null
          recommended_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      featured_packages: {
        Row: {
          created_at: string
          credits_used: number
          end_date: string
          id: string
          package_id: string
          position: string
          priority: number
          start_date: string
          status: string
          travel_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          end_date: string
          id?: string
          package_id: string
          position?: string
          priority?: number
          start_date?: string
          status?: string
          travel_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          end_date?: string
          id?: string
          package_id?: string
          position?: string
          priority?: number
          start_date?: string
          status?: string
          travel_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_packages_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
            referencedRelation: "travels"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          admin_notes: string | null
          app_version: string | null
          category: string | null
          created_at: string
          description: string | null
          device_info: Json | null
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          rating: number | null
          resolved_at: string | null
          resolved_by: string | null
          screenshot_url: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          app_version?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          device_info?: Json | null
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          rating?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          app_version?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          device_info?: Json | null
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          rating?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      geofence_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          distance_from_center: number | null
          geofence_id: string
          id: string
          is_acknowledged: boolean | null
          latitude: number
          longitude: number
          user_id: string
          user_name: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          distance_from_center?: number | null
          geofence_id: string
          id?: string
          is_acknowledged?: boolean | null
          latitude: number
          longitude: number
          user_id: string
          user_name: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          distance_from_center?: number | null
          geofence_id?: string
          id?: string
          is_acknowledged?: boolean | null
          latitude?: number
          longitude?: number
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofence_alerts_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
        ]
      }
      geofences: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          group_id: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          radius_meters: number
          travel_id: string | null
          updated_at: string
          zone_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
          travel_id?: string | null
          updated_at?: string
          zone_type?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
          travel_id?: string | null
          updated_at?: string
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofences_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tracking_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofences_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
            referencedRelation: "travels"
            referencedColumns: ["id"]
          },
        ]
      }
      group_locations: {
        Row: {
          accuracy: number | null
          battery_level: number | null
          created_at: string
          group_id: string
          id: string
          is_sharing: boolean | null
          last_updated: string
          latitude: number
          longitude: number
          user_id: string
          user_name: string
        }
        Insert: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          group_id: string
          id?: string
          is_sharing?: boolean | null
          last_updated?: string
          latitude: number
          longitude: number
          user_id: string
          user_name: string
        }
        Update: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          group_id?: string
          id?: string
          is_sharing?: boolean | null
          last_updated?: string
          latitude?: number
          longitude?: number
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_locations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tracking_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      haji_checklists: {
        Row: {
          applies_to: string[] | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          priority: number | null
          title: string
          updated_at: string
        }
        Insert: {
          applies_to?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          priority?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          applies_to?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          priority?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      haji_registrations: {
        Row: {
          address: string | null
          agent_notes: string | null
          birth_date: string
          created_at: string
          documents: Json | null
          dp_amount: number | null
          dp_paid_at: string | null
          email: string | null
          estimated_departure_year: number | null
          full_name: string
          id: string
          nik: string
          package_id: string
          phone: string
          porsi_number: string | null
          registration_year: number | null
          status: string
          travel_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          agent_notes?: string | null
          birth_date: string
          created_at?: string
          documents?: Json | null
          dp_amount?: number | null
          dp_paid_at?: string | null
          email?: string | null
          estimated_departure_year?: number | null
          full_name: string
          id?: string
          nik: string
          package_id: string
          phone: string
          porsi_number?: string | null
          registration_year?: number | null
          status?: string
          travel_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          agent_notes?: string | null
          birth_date?: string
          created_at?: string
          documents?: Json | null
          dp_amount?: number | null
          dp_paid_at?: string | null
          email?: string | null
          estimated_departure_year?: number | null
          full_name?: string
          id?: string
          nik?: string
          package_id?: string
          phone?: string
          porsi_number?: string | null
          registration_year?: number | null
          status?: string
          travel_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "haji_registrations_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "haji_registrations_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
            referencedRelation: "travels"
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
      ibadah_habits: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_ramadan_specific: boolean | null
          name: string
          name_arabic: string | null
          priority: number | null
          target_count: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_ramadan_specific?: boolean | null
          name: string
          name_arabic?: string | null
          priority?: number | null
          target_count?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_ramadan_specific?: boolean | null
          name?: string
          name_arabic?: string | null
          priority?: number | null
          target_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      important_locations: {
        Row: {
          address: string | null
          category: string
          city: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          name_arabic: string | null
          opening_hours: string | null
          phone: string | null
          priority: number
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          name_arabic?: string | null
          opening_hours?: string | null
          phone?: string | null
          priority?: number
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          name_arabic?: string | null
          opening_hours?: string | null
          phone?: string | null
          priority?: number
          updated_at?: string
          website?: string | null
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
      manasik_guides: {
        Row: {
          audio_url: string | null
          category: string
          content: string
          created_at: string
          description: string | null
          doa_arabic: string | null
          doa_latin: string | null
          doa_meaning: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          order_index: number
          title: string
          title_arabic: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          category?: string
          content: string
          created_at?: string
          description?: string | null
          doa_arabic?: string | null
          doa_latin?: string | null
          doa_meaning?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number
          title: string
          title_arabic?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          category?: string
          content?: string
          created_at?: string
          description?: string | null
          doa_arabic?: string | null
          doa_latin?: string | null
          doa_meaning?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number
          title?: string
          title_arabic?: string | null
          updated_at?: string
          video_url?: string | null
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
      order_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          order_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          order_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          order_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
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
      package_inquiries: {
        Row: {
          agent_notes: string | null
          contacted_at: string | null
          created_at: string
          departure_id: string | null
          email: string | null
          full_name: string
          id: string
          message: string | null
          number_of_people: number | null
          package_id: string
          phone: string
          status: string
          travel_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent_notes?: string | null
          contacted_at?: string | null
          created_at?: string
          departure_id?: string | null
          email?: string | null
          full_name: string
          id?: string
          message?: string | null
          number_of_people?: number | null
          package_id: string
          phone: string
          status?: string
          travel_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent_notes?: string | null
          contacted_at?: string | null
          created_at?: string
          departure_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          message?: string | null
          number_of_people?: number | null
          package_id?: string
          phone?: string
          status?: string
          travel_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_inquiries_departure_id_fkey"
            columns: ["departure_id"]
            isOneToOne: false
            referencedRelation: "departures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_inquiries_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_inquiries_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
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
          age_requirement: string | null
          airline: string | null
          created_at: string
          description: string | null
          duration_days: number
          estimated_departure_year: number | null
          facilities: string[] | null
          flight_type: string | null
          haji_season: string | null
          haji_year: number | null
          health_requirements: string[] | null
          hotel_madinah: string | null
          hotel_makkah: string | null
          hotel_star: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          meal_type: string | null
          min_dp: number | null
          name: string
          package_type: Database["public"]["Enums"]["package_type"]
          quota_type: string | null
          registration_deadline: string | null
          travel_id: string
          updated_at: string
        }
        Insert: {
          age_requirement?: string | null
          airline?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          estimated_departure_year?: number | null
          facilities?: string[] | null
          flight_type?: string | null
          haji_season?: string | null
          haji_year?: number | null
          health_requirements?: string[] | null
          hotel_madinah?: string | null
          hotel_makkah?: string | null
          hotel_star?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          meal_type?: string | null
          min_dp?: number | null
          name: string
          package_type?: Database["public"]["Enums"]["package_type"]
          quota_type?: string | null
          registration_deadline?: string | null
          travel_id: string
          updated_at?: string
        }
        Update: {
          age_requirement?: string | null
          airline?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          estimated_departure_year?: number | null
          facilities?: string[] | null
          flight_type?: string | null
          haji_season?: string | null
          haji_year?: number | null
          health_requirements?: string[] | null
          hotel_madinah?: string | null
          hotel_makkah?: string | null
          hotel_star?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          meal_type?: string | null
          min_dp?: number | null
          name?: string
          package_type?: Database["public"]["Enums"]["package_type"]
          quota_type?: string | null
          registration_deadline?: string | null
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
      packing_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          gender: string
          id: string
          is_active: boolean | null
          is_essential: boolean | null
          name: string
          priority: number
          quantity_suggestion: number | null
          updated_at: string
          weather_related: boolean | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          gender?: string
          id?: string
          is_active?: boolean | null
          is_essential?: boolean | null
          name: string
          priority?: number
          quantity_suggestion?: number | null
          updated_at?: string
          weather_related?: boolean | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          gender?: string
          id?: string
          is_active?: boolean | null
          is_essential?: boolean | null
          name?: string
          priority?: number
          quantity_suggestion?: number | null
          updated_at?: string
          weather_related?: boolean | null
        }
        Relationships: []
      }
      page_versions: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          design_data: Json | null
          id: string
          layout_data: Json | null
          page_id: string | null
          version_name: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          design_data?: Json | null
          id?: string
          layout_data?: Json | null
          page_id?: string | null
          version_name?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          design_data?: Json | null
          id?: string
          layout_data?: Json | null
          page_id?: string | null
          version_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "static_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_notification_logs: {
        Row: {
          body: string
          booking_id: string | null
          id: string
          is_read: boolean | null
          notification_type: string
          payment_schedule_id: string | null
          read_at: string | null
          sent_at: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          booking_id?: string | null
          id?: string
          is_read?: boolean | null
          notification_type: string
          payment_schedule_id?: string | null
          read_at?: string | null
          sent_at?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          booking_id?: string | null
          id?: string
          is_read?: boolean | null
          notification_type?: string
          payment_schedule_id?: string | null
          read_at?: string | null
          sent_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_notification_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_notification_logs_payment_schedule_id_fkey"
            columns: ["payment_schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          due_date: string
          id: string
          is_paid: boolean
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_proof_url: string | null
          payment_type: string
          reminder_sent_h1: boolean | null
          reminder_sent_h3: boolean | null
          reminder_sent_h7: boolean | null
          reminder_sent_overdue: boolean | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          due_date: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_proof_url?: string | null
          payment_type: string
          reminder_sent_h1?: boolean | null
          reminder_sent_h3?: boolean | null
          reminder_sent_h7?: boolean | null
          reminder_sent_overdue?: boolean | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          due_date?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_proof_url?: string | null
          payment_type?: string
          reminder_sent_h1?: boolean | null
          reminder_sent_h3?: boolean | null
          reminder_sent_h7?: boolean | null
          reminder_sent_overdue?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
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
      product_reviews: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_wishlist: {
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
            foreignKeyName: "product_wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
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
          email?: string | null
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
          email?: string | null
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quran_ayahs: {
        Row: {
          arabic_text: string
          ayah_global: number | null
          ayah_number: number
          created_at: string
          id: string
          juz: number | null
          page: number | null
          surah_number: number
          translation_id: string | null
          updated_at: string
        }
        Insert: {
          arabic_text: string
          ayah_global?: number | null
          ayah_number: number
          created_at?: string
          id?: string
          juz?: number | null
          page?: number | null
          surah_number: number
          translation_id?: string | null
          updated_at?: string
        }
        Update: {
          arabic_text?: string
          ayah_global?: number | null
          ayah_number?: number
          created_at?: string
          id?: string
          juz?: number | null
          page?: number | null
          surah_number?: number
          translation_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quran_khatam_targets: {
        Row: {
          ayat_per_day: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          pages_per_day: number | null
          target_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ayat_per_day?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pages_per_day?: number | null
          target_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ayat_per_day?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pages_per_day?: number | null
          target_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quran_last_read: {
        Row: {
          ayah_number: number
          juz_number: number
          surah_number: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ayah_number: number
          juz_number?: number
          surah_number: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ayah_number?: number
          juz_number?: number
          surah_number?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quran_surahs: {
        Row: {
          created_at: string
          english_name: string | null
          id: number
          juz_start: number | null
          name: string
          name_arabic: string
          number: number
          revelation_type: string | null
          total_verses: number
          translation_name: string | null
        }
        Insert: {
          created_at?: string
          english_name?: string | null
          id?: number
          juz_start?: number | null
          name: string
          name_arabic: string
          number: number
          revelation_type?: string | null
          total_verses: number
          translation_name?: string | null
        }
        Update: {
          created_at?: string
          english_name?: string | null
          id?: number
          juz_start?: number | null
          name?: string
          name_arabic?: string
          number?: number
          revelation_type?: string | null
          total_verses?: number
          translation_name?: string | null
        }
        Relationships: []
      }
      quran_sync_logs: {
        Row: {
          ayahs_synced: number | null
          completed_at: string | null
          error_message: string | null
          id: string
          started_at: string
          status: string
          surahs_synced: number | null
          sync_type: string
        }
        Insert: {
          ayahs_synced?: number | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          started_at?: string
          status?: string
          surahs_synced?: number | null
          sync_type?: string
        }
        Update: {
          ayahs_synced?: number | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          started_at?: string
          status?: string
          surahs_synced?: number | null
          sync_type?: string
        }
        Relationships: []
      }
      quran_tadarus_logs: {
        Row: {
          ayah_end: number
          ayah_start: number
          created_at: string | null
          id: string
          juz_end: number | null
          juz_start: number | null
          read_date: string
          surah_end: number
          surah_start: number
          total_verses: number
          user_id: string
        }
        Insert: {
          ayah_end: number
          ayah_start: number
          created_at?: string | null
          id?: string
          juz_end?: number | null
          juz_start?: number | null
          read_date?: string
          surah_end: number
          surah_start: number
          total_verses: number
          user_id: string
        }
        Update: {
          ayah_end?: number
          ayah_start?: number
          created_at?: string | null
          id?: string
          juz_end?: number | null
          juz_start?: number | null
          read_date?: string
          surah_end?: number
          surah_start?: number
          total_verses?: number
          user_id?: string
        }
        Relationships: []
      }
      quran_tips: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          day_number: number | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          day_number?: number | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          day_number?: number | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          title?: string
        }
        Relationships: []
      }
      sedekah_types: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_arabic: string | null
          priority: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_arabic?: string | null
          priority?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_arabic?: string | null
          priority?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      seller_applications: {
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
          shop_name: string
          status: string
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
          shop_name: string
          status?: string
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
          shop_name?: string
          status?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      seller_credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          price: number | null
          product_id: string | null
          seller_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          price?: number | null
          product_id?: string | null
          seller_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          price?: number | null
          product_id?: string | null
          seller_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_credit_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_credits: {
        Row: {
          created_at: string
          credits_remaining: number
          credits_used: number
          id: string
          last_purchase_date: string | null
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          id?: string
          last_purchase_date?: string | null
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          id?: string
          last_purchase_date?: string | null
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_credits_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_featured_products: {
        Row: {
          created_at: string
          credits_used: number | null
          end_date: string
          id: string
          position: string | null
          priority: number | null
          product_id: string
          seller_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_used?: number | null
          end_date: string
          id?: string
          position?: string | null
          priority?: number | null
          product_id: string
          seller_id: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_used?: number | null
          end_date?: string
          id?: string
          position?: string | null
          priority?: number | null
          product_id?: string
          seller_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_featured_products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_membership_plans: {
        Row: {
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean | null
          max_featured: number
          max_products: number
          name: string
          price_monthly: number
          price_yearly: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          max_featured?: number
          max_products?: number
          name: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          max_featured?: number
          max_products?: number
          name?: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      seller_memberships: {
        Row: {
          admin_notes: string | null
          amount: number | null
          created_at: string
          end_date: string | null
          id: string
          payment_proof_url: string | null
          plan_id: string | null
          seller_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          payment_proof_url?: string | null
          plan_id?: string | null
          seller_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          payment_proof_url?: string | null
          plan_id?: string | null
          seller_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "seller_membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_memberships_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          address: string | null
          banner_url: string | null
          city: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          phone: string | null
          rating: number | null
          review_count: number | null
          shop_description: string | null
          shop_name: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          shop_description?: string | null
          shop_name: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          shop_description?: string | null
          shop_name?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      seller_reviews: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          is_published: boolean | null
          order_id: string | null
          rating: number
          review_text: string | null
          seller_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          order_id?: string | null
          rating: number
          review_text?: string | null
          seller_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          order_id?: string | null
          rating?: number
          review_text?: string | null
          seller_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "shop_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_chat_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          order_id: string | null
          read_at: string | null
          seller_id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          order_id?: string | null
          read_at?: string | null
          seller_id: string
          sender_id: string
          sender_role: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          order_id?: string | null
          read_at?: string | null
          seller_id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_chat_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_chat_messages_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_price: number
          quantity?: number
          subtotal?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          courier: string | null
          created_at: string
          id: string
          notes: string | null
          order_code: string
          paid_at: string | null
          payment_proof_url: string | null
          seller_id: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          status: Database["public"]["Enums"]["shop_order_status"]
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          courier?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_code?: string
          paid_at?: string | null
          payment_proof_url?: string | null
          seller_id?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          status?: Database["public"]["Enums"]["shop_order_status"]
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          courier?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_code?: string
          paid_at?: string | null
          payment_proof_url?: string | null
          seller_id?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          status?: Database["public"]["Enums"]["shop_order_status"]
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          category_id: string | null
          compare_price: number | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price: number
          seller_id: string | null
          slug: string
          stock: number
          thumbnail_url: string | null
          updated_at: string
          weight_gram: number | null
        }
        Insert: {
          category_id?: string | null
          compare_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price?: number
          seller_id?: string | null
          slug: string
          stock?: number
          thumbnail_url?: string | null
          updated_at?: string
          weight_gram?: number | null
        }
        Update: {
          category_id?: string | null
          compare_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number
          seller_id?: string | null
          slug?: string
          stock?: number
          thumbnail_url?: string | null
          updated_at?: string
          weight_gram?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      static_pages: {
        Row: {
          content: string | null
          created_at: string
          design_data: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          layout_data: Json | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          page_type: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          design_data?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          layout_data?: Json | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          page_type?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          design_data?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          layout_data?: Json | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          page_type?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean | null
          name: string
          price_yearly: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          price_yearly?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_yearly?: number
          updated_at?: string
        }
        Relationships: []
      }
      tracking_groups: {
        Row: {
          code: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean | null
          name: string
          travel_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean | null
          name: string
          travel_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean | null
          name?: string
          travel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_groups_travel_id_fkey"
            columns: ["travel_id"]
            isOneToOne: false
            referencedRelation: "travels"
            referencedColumns: ["id"]
          },
        ]
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
      user_achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_custom_habits: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          target_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          target_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_dzikir_logs: {
        Row: {
          completed_at: string | null
          count: number
          created_at: string
          dzikir_type_id: string | null
          id: string
          log_date: string
          session_id: string | null
          target_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          count?: number
          created_at?: string
          dzikir_type_id?: string | null
          id?: string
          log_date?: string
          session_id?: string | null
          target_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          count?: number
          created_at?: string
          dzikir_type_id?: string | null
          id?: string
          log_date?: string
          session_id?: string | null
          target_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dzikir_logs_dzikir_type_id_fkey"
            columns: ["dzikir_type_id"]
            isOneToOne: false
            referencedRelation: "dzikir_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exercise_logs: {
        Row: {
          created_at: string
          duration_minutes: number
          exercise_type_id: string | null
          id: string
          intensity: string | null
          log_date: string
          notes: string | null
          time_of_day: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          exercise_type_id?: string | null
          id?: string
          intensity?: string | null
          log_date?: string
          notes?: string | null
          time_of_day?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          exercise_type_id?: string | null
          id?: string
          intensity?: string | null
          log_date?: string
          notes?: string | null
          time_of_day?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_logs_exercise_type_id_fkey"
            columns: ["exercise_type_id"]
            isOneToOne: false
            referencedRelation: "exercise_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ibadah_logs: {
        Row: {
          completed_count: number | null
          created_at: string
          habit_id: string
          id: string
          is_completed: boolean | null
          log_date: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_count?: number | null
          created_at?: string
          habit_id: string
          id?: string
          is_completed?: boolean | null
          log_date?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_count?: number | null
          created_at?: string
          habit_id?: string
          id?: string
          is_completed?: boolean | null
          log_date?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ibadah_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "ibadah_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ibadah_streaks: {
        Row: {
          created_at: string
          current_streak: number | null
          custom_habit_id: string | null
          habit_id: string | null
          id: string
          last_completed_date: string | null
          longest_streak: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          custom_habit_id?: string | null
          habit_id?: string | null
          id?: string
          last_completed_date?: string | null
          longest_streak?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          custom_habit_id?: string | null
          habit_id?: string | null
          id?: string
          last_completed_date?: string | null
          longest_streak?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ibadah_streaks_custom_habit_id_fkey"
            columns: ["custom_habit_id"]
            isOneToOne: false
            referencedRelation: "user_custom_habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ibadah_streaks_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "ibadah_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_meal_logs: {
        Row: {
          carb_source: string | null
          created_at: string
          fruits: string | null
          id: string
          is_healthy: boolean | null
          is_skipped: boolean | null
          log_date: string
          meal_type: string
          notes: string | null
          protein_source: string | null
          updated_at: string
          user_id: string
          vegetables: string | null
          water_glasses: number | null
        }
        Insert: {
          carb_source?: string | null
          created_at?: string
          fruits?: string | null
          id?: string
          is_healthy?: boolean | null
          is_skipped?: boolean | null
          log_date?: string
          meal_type: string
          notes?: string | null
          protein_source?: string | null
          updated_at?: string
          user_id: string
          vegetables?: string | null
          water_glasses?: number | null
        }
        Update: {
          carb_source?: string | null
          created_at?: string
          fruits?: string | null
          id?: string
          is_healthy?: boolean | null
          is_skipped?: boolean | null
          log_date?: string
          meal_type?: string
          notes?: string | null
          protein_source?: string | null
          updated_at?: string
          user_id?: string
          vegetables?: string | null
          water_glasses?: number | null
        }
        Relationships: []
      }
      user_quran_logs: {
        Row: {
          created_at: string
          end_verse: number
          id: string
          juz_number: number | null
          log_date: string
          notes: string | null
          pages_read: number | null
          start_verse: number
          surah_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_verse: number
          id?: string
          juz_number?: number | null
          log_date?: string
          notes?: string | null
          pages_read?: number | null
          start_verse?: number
          surah_number: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_verse?: number
          id?: string
          juz_number?: number | null
          log_date?: string
          notes?: string | null
          pages_read?: number | null
          start_verse?: number
          surah_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ramadan_settings: {
        Row: {
          created_at: string
          enable_exercise_reminder: boolean | null
          enable_lailatul_qadar_mode: boolean | null
          enable_sedekah_reminder: boolean | null
          id: string
          ramadan_year: number
          sedekah_target: number | null
          tilawah_target_pages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enable_exercise_reminder?: boolean | null
          enable_lailatul_qadar_mode?: boolean | null
          enable_sedekah_reminder?: boolean | null
          id?: string
          ramadan_year?: number
          sedekah_target?: number | null
          tilawah_target_pages?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enable_exercise_reminder?: boolean | null
          enable_lailatul_qadar_mode?: boolean | null
          enable_sedekah_reminder?: boolean | null
          id?: string
          ramadan_year?: number
          sedekah_target?: number | null
          tilawah_target_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_sedekah_logs: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          id: string
          is_subuh_mode: boolean | null
          log_date: string
          sedekah_type_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_subuh_mode?: boolean | null
          log_date?: string
          sedekah_type_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_subuh_mode?: boolean | null
          log_date?: string
          sedekah_type_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sedekah_logs_sedekah_type_id_fkey"
            columns: ["sedekah_type_id"]
            isOneToOne: false
            referencedRelation: "sedekah_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          admin_notes: string | null
          created_at: string
          end_date: string | null
          id: string
          payment_amount: number | null
          payment_date: string | null
          payment_proof_url: string | null
          plan_id: string | null
          start_date: string | null
          status: string
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_proof_url?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_proof_url?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      website_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_premium: boolean
          name: string
          slug: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name: string
          slug: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name?: string
          slug?: string
          thumbnail_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_tadarus_dashboard: {
        Row: {
          hari_tadarus: number | null
          progress_juz: number | null
          total_ayat: number | null
          total_surat: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_booking_code: { Args: never; Returns: string }
      generate_group_code: { Args: never; Returns: string }
      generate_shop_order_code: { Args: never; Returns: string }
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
      app_role: "jamaah" | "agent" | "admin" | "shop_admin" | "seller"
      checklist_category: "dokumen" | "perlengkapan" | "kesehatan" | "mental"
      feedback_type: "bug" | "suggestion" | "rating" | "other"
      package_type: "umroh" | "haji_reguler" | "haji_plus" | "haji_furoda"
      shop_order_status:
        | "pending"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
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
      app_role: ["jamaah", "agent", "admin", "shop_admin", "seller"],
      checklist_category: ["dokumen", "perlengkapan", "kesehatan", "mental"],
      feedback_type: ["bug", "suggestion", "rating", "other"],
      package_type: ["umroh", "haji_reguler", "haji_plus", "haji_furoda"],
      shop_order_status: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
