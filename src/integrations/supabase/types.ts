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
      bonus_coupons: {
        Row: {
          awarded_at: string
          id: string
          streak_end_day: string
          vehicle_reg: string
        }
        Insert: {
          awarded_at?: string
          id?: string
          streak_end_day: string
          vehicle_reg: string
        }
        Update: {
          awarded_at?: string
          id?: string
          streak_end_day?: string
          vehicle_reg?: string
        }
        Relationships: []
      }
      coupon_entries: {
        Row: {
          amount: number
          coupon_id: string
          entry_id: string
        }
        Insert: {
          amount: number
          coupon_id: string
          entry_id: string
        }
        Update: {
          amount?: number
          coupon_id?: string
          entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_entries_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_entries_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          coupon_number: string
          coupon_type: string
          coupon_value: number
          customer_name: string
          expiry_date: string | null
          fuel_entry_id: string | null
          id: string
          issued_date: string | null
          mobile: string
          printed: boolean | null
          redeemed: boolean | null
          redeemed_date: string | null
          vehicle_registration: string
        }
        Insert: {
          coupon_number: string
          coupon_type: string
          coupon_value: number
          customer_name: string
          expiry_date?: string | null
          fuel_entry_id?: string | null
          id?: string
          issued_date?: string | null
          mobile: string
          printed?: boolean | null
          redeemed?: boolean | null
          redeemed_date?: string | null
          vehicle_registration: string
        }
        Update: {
          coupon_number?: string
          coupon_type?: string
          coupon_value?: number
          customer_name?: string
          expiry_date?: string | null
          fuel_entry_id?: string | null
          id?: string
          issued_date?: string | null
          mobile?: string
          printed?: boolean | null
          redeemed?: boolean | null
          redeemed_date?: string | null
          vehicle_registration?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_fuel_entry_id_fkey"
            columns: ["fuel_entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_streak: {
        Row: {
          current_streak: number | null
          last_visit: string | null
          longest_streak: number | null
          mobile: string
        }
        Insert: {
          current_streak?: number | null
          last_visit?: string | null
          longest_streak?: number | null
          mobile: string
        }
        Update: {
          current_streak?: number | null
          last_visit?: string | null
          longest_streak?: number | null
          mobile?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          customer_name: string
          id: string
          mobile: string
          updated_at: string | null
          vehicle_registration: string
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          id?: string
          mobile: string
          updated_at?: string | null
          vehicle_registration: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          id?: string
          mobile?: string
          updated_at?: string | null
          vehicle_registration?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          amount: number
          coupon_generated: boolean | null
          created_at: string
          driver_name: string
          entry_day: string
          id: string
          mobile: string
          photo_path: string | null
          vehicle_reg: string
          worker_id: string | null
        }
        Insert: {
          amount: number
          coupon_generated?: boolean | null
          created_at?: string
          driver_name: string
          entry_day?: string
          id?: string
          mobile: string
          photo_path?: string | null
          vehicle_reg: string
          worker_id?: string | null
        }
        Update: {
          amount?: number
          coupon_generated?: boolean | null
          created_at?: string
          driver_name?: string
          entry_day?: string
          id?: string
          mobile?: string
          photo_path?: string | null
          vehicle_reg?: string
          worker_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          username?: string
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
      find_customer: {
        Args: { p_mobile: string }
        Returns: {
          customer_name: string
          id: string
          vehicle_registration: string
        }[]
      }
      find_driver: {
        Args: { p_mobile: string }
        Returns: {
          driver_name: string
          vehicle_reg: string
        }[]
      }
      generate_coupon_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_coupon: { Args: { p_vehicle_reg: string }; Returns: Json }
      submit_entry: {
        Args: {
          p_amount: number
          p_driver_name: string
          p_mobile: string
          p_photo_path: string
          p_vehicle_reg: string
          p_worker_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "worker"
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
      app_role: ["admin", "worker"],
    },
  },
} as const
