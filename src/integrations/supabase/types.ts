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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      credit_logs: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          credits_granted: number
          gateway: string
          id: string
          plan_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          credits_granted?: number
          gateway: string
          id?: string
          plan_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          credits_granted?: number
          gateway?: string
          id?: string
          plan_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credits_history: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          order_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          abacatepay_id: string | null
          amount: number
          created_at: string
          gateway: string | null
          hubla_transaction_id: string | null
          id: string
          paid_at: string | null
          payment_data: Json | null
          payment_method: string | null
          plan_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          abacatepay_id?: string | null
          amount: number
          created_at?: string
          gateway?: string | null
          hubla_transaction_id?: string | null
          id?: string
          paid_at?: string | null
          payment_data?: Json | null
          payment_method?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          abacatepay_id?: string | null
          amount?: number
          created_at?: string
          gateway?: string | null
          hubla_transaction_id?: string | null
          id?: string
          paid_at?: string | null
          payment_data?: Json | null
          payment_method?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          created_at: string
          error_message: string | null
          gateway: string
          id: string
          order_id: string | null
          request_body: Json | null
          response_body: Json | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          gateway: string
          id?: string
          order_id?: string | null
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          gateway?: string
          id?: string
          order_id?: string | null
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          card_gateway: string | null
          created_at: string
          credits_granted: number
          description: string | null
          features: Json | null
          hubla_checkout_url: string | null
          id: string
          is_active: boolean
          kiwify_product_id: string | null
          name: string
          pix_price: number | null
          price: number
          stripe_price: number | null
          stripe_price_id: string | null
          type: Database["public"]["Enums"]["plan_type"]
          updated_at: string
        }
        Insert: {
          card_gateway?: string | null
          created_at?: string
          credits_granted?: number
          description?: string | null
          features?: Json | null
          hubla_checkout_url?: string | null
          id?: string
          is_active?: boolean
          kiwify_product_id?: string | null
          name: string
          pix_price?: number | null
          price: number
          stripe_price?: number | null
          stripe_price_id?: string | null
          type: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
        }
        Update: {
          card_gateway?: string | null
          created_at?: string
          credits_granted?: number
          description?: string | null
          features?: Json | null
          hubla_checkout_url?: string | null
          id?: string
          is_active?: boolean
          kiwify_product_id?: string | null
          name?: string
          pix_price?: number | null
          price?: number
          stripe_price?: number | null
          stripe_price_id?: string | null
          type?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_properties: {
        Row: {
          amenities: string[] | null
          area: number
          bathrooms: number | null
          bedrooms: number | null
          condominium_fee: number | null
          construction_year: number | null
          created_at: string
          description: string | null
          floor_number: number | null
          id: string
          iptu: number | null
          location: string
          parking_spaces: number | null
          photos: string[]
          price: number
          project_id: string
          property_type: string
          purpose: string
          title: string
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          area: number
          bathrooms?: number | null
          bedrooms?: number | null
          condominium_fee?: number | null
          construction_year?: number | null
          created_at?: string
          description?: string | null
          floor_number?: number | null
          id?: string
          iptu?: number | null
          location: string
          parking_spaces?: number | null
          photos?: string[]
          price: number
          project_id: string
          property_type: string
          purpose: string
          title: string
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          area?: number
          bathrooms?: number | null
          bedrooms?: number | null
          condominium_fee?: number | null
          construction_year?: number | null
          created_at?: string
          description?: string | null
          floor_number?: number | null
          id?: string
          iptu?: number | null
          location?: string
          parking_spaces?: number | null
          photos?: string[]
          price?: number
          project_id?: string
          property_type?: string
          purpose?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_properties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          company: string | null
          created_at: string
          credits: number
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          project_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          project_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          project_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      projects: {
        Row: {
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          color_palette: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          landing_page_url: string | null
          layout_choice: string | null
          location: string | null
          logo_url: string | null
          photos: string[] | null
          price: number | null
          project_type: Database["public"]["Enums"]["project_type"] | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          user_plan_id: string | null
          wizard_data: Json | null
        }
        Insert: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          color_palette?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          landing_page_url?: string | null
          layout_choice?: string | null
          location?: string | null
          logo_url?: string | null
          photos?: string[] | null
          price?: number | null
          project_type?: Database["public"]["Enums"]["project_type"] | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          user_plan_id?: string | null
          wizard_data?: Json | null
        }
        Update: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          color_palette?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          landing_page_url?: string | null
          layout_choice?: string | null
          location?: string | null
          logo_url?: string | null
          photos?: string[] | null
          price?: number | null
          project_type?: Database["public"]["Enums"]["project_type"] | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          user_plan_id?: string | null
          wizard_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_plan_id_fkey"
            columns: ["user_plan_id"]
            isOneToOne: false
            referencedRelation: "user_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_plan_id_fkey"
            columns: ["user_plan_id"]
            isOneToOne: false
            referencedRelation: "user_plans_detailed"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      transactions: {
        Row: {
          abacatepay_id: string | null
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          payment_data: Json | null
          payment_method: string | null
          plan_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          abacatepay_id?: string | null
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_data?: Json | null
          payment_method?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          abacatepay_id?: string | null
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_data?: Json | null
          payment_method?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_plans: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          order_id: string | null
          plan_id: string
          status: string
          used_at: string | null
          used_for_project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          plan_id: string
          status?: string
          used_at?: string | null
          used_for_project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          plan_id?: string
          status?: string
          used_at?: string | null
          used_for_project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plans_used_for_project_id_fkey"
            columns: ["used_for_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_plans_detailed: {
        Row: {
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string | null
          notes: string | null
          plan_id: string | null
          plan_name: string | null
          plan_type: Database["public"]["Enums"]["plan_type"] | null
          price: number | null
          status: string | null
          used_at: string | null
          used_for_project_id: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plans_used_for_project_id_fkey"
            columns: ["used_for_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_credits: {
        Args: {
          _amount: number
          _description?: string
          _order_id?: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      add_user_plan: {
        Args: { _order_id?: string; _plan_id: string; _user_id: string }
        Returns: string
      }
      admin_assign_plan_to_user: {
        Args: { _notes?: string; _plan_id: string; _user_id: string }
        Returns: string
      }
      get_available_user_plans: {
        Args: { _user_id: string }
        Returns: {
          count: number
          expires_at: string
          plan_id: string
          plan_name: string
          plan_type: string
        }[]
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_database_stats: { Args: never; Returns: Json }
      get_system_metrics: { Args: never; Returns: Json }
      is_admin_or_dev: { Args: never; Returns: boolean }
      link_user_transaction: {
        Args: { user_email: string }
        Returns: undefined
      }
      use_credits: {
        Args: { _amount: number; _description?: string; _user_id: string }
        Returns: boolean
      }
      use_user_plan: {
        Args: { _plan_id: string; _project_id: string; _user_id: string }
        Returns: string
      }
    }
    Enums: {
      notification_type: "info" | "success" | "warning" | "error"
      plan_type:
        | "website_only"
        | "website_maintenance_1m"
        | "website_maintenance_6m"
      project_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "approved"
        | "rejected"
      project_type: "single_property" | "realtor_multiple"
      property_type: "house" | "apartment" | "land" | "commercial"
      transaction_status: "pending" | "paid" | "failed" | "refunded"
      user_role: "user" | "admin" | "dev"
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
      notification_type: ["info", "success", "warning", "error"],
      plan_type: [
        "website_only",
        "website_maintenance_1m",
        "website_maintenance_6m",
      ],
      project_status: [
        "pending",
        "in_progress",
        "completed",
        "approved",
        "rejected",
      ],
      project_type: ["single_property", "realtor_multiple"],
      property_type: ["house", "apartment", "land", "commercial"],
      transaction_status: ["pending", "paid", "failed", "refunded"],
      user_role: ["user", "admin", "dev"],
    },
  },
} as const
