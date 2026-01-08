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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string | null
          id: string
          name: string
          onboarding_completed: boolean
          plan_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          onboarding_completed?: boolean
          plan_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          onboarding_completed?: boolean
          plan_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          account_id: string | null
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          project_id: string
          questions_per_step: number
          submission_layout: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          project_id: string
          questions_per_step?: number
          submission_layout?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          project_id?: string
          questions_per_step?: number
          submission_layout?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "forms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          features: Json
          id: string
          is_active: boolean
          max_forms_per_project: number
          max_projects: number
          max_responses_per_form: number
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_forms_per_project?: number
          max_projects?: number
          max_responses_per_form?: number
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_forms_per_project?: number
          max_projects?: number
          max_responses_per_form?: number
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          account_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          created_at: string | null
          form_id: string
          full_url: string
          id: string
          location_name: string | null
          scan_count: number
          short_url: string
        }
        Insert: {
          created_at?: string | null
          form_id: string
          full_url: string
          id?: string
          location_name?: string | null
          scan_count?: number
          short_url: string
        }
        Update: {
          created_at?: string | null
          form_id?: string
          full_url?: string
          id?: string
          location_name?: string | null
          scan_count?: number
          short_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form_analytics"
            referencedColumns: ["form_id"]
          },
          {
            foreignKeyName: "qr_codes_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "response_trends"
            referencedColumns: ["form_id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string | null
          description: string | null
          form_id: string
          id: string
          options: Json | null
          order_index: number
          rating_scale: number | null
          required: boolean
          title: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          form_id: string
          id?: string
          options?: Json | null
          order_index: number
          rating_scale?: number | null
          required?: boolean
          title: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          form_id?: string
          id?: string
          options?: Json | null
          order_index?: number
          rating_scale?: number | null
          required?: boolean
          title?: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form_analytics"
            referencedColumns: ["form_id"]
          },
          {
            foreignKeyName: "questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "response_trends"
            referencedColumns: ["form_id"]
          },
        ]
      }
      response_items: {
        Row: {
          created_at: string | null
          id: string
          question_id: string
          response_id: string
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: string
          response_id: string
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string
          response_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_items_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          form_id: string
          id: string
          ip_hash: string | null
          location_name: string | null
          qr_code_id: string | null
          submitted_at: string | null
          user_agent_hash: string | null
        }
        Insert: {
          form_id: string
          id?: string
          ip_hash?: string | null
          location_name?: string | null
          qr_code_id?: string | null
          submitted_at?: string | null
          user_agent_hash?: string | null
        }
        Update: {
          form_id?: string
          id?: string
          ip_hash?: string | null
          location_name?: string | null
          qr_code_id?: string | null
          submitted_at?: string | null
          user_agent_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form_analytics"
            referencedColumns: ["form_id"]
          },
          {
            foreignKeyName: "responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "response_trends"
            referencedColumns: ["form_id"]
          },
          {
            foreignKeyName: "responses_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          account_id: string
          cancel_at_period_end: boolean
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          cancel_at_period_end?: boolean
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          cancel_at_period_end?: boolean
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          account_id: string
          created_at: string | null
          forms_count: number
          id: string
          period_end: string
          period_start: string
          projects_count: number
          qr_scans_count: number
          responses_count: number
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          forms_count?: number
          id?: string
          period_end: string
          period_start: string
          projects_count?: number
          qr_scans_count?: number
          responses_count?: number
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          forms_count?: number
          id?: string
          period_end?: string
          period_start?: string
          projects_count?: number
          qr_scans_count?: number
          responses_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_summary: {
        Row: {
          account_id: string | null
          first_response_at: string | null
          forms_count: number | null
          latest_response_at: string | null
          project_id: string | null
          project_name: string | null
          qr_codes_count: number | null
          responses_last_30_days: number | null
          responses_last_7_days: number | null
          total_responses: number | null
          total_scans: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      form_analytics: {
        Row: {
          account_id: string | null
          conversion_rate: number | null
          first_response_at: string | null
          form_id: string | null
          form_name: string | null
          latest_response_at: string | null
          qr_codes_count: number | null
          responses_last_30_days: number | null
          responses_last_7_days: number | null
          total_responses: number | null
          total_scans: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      response_trends: {
        Row: {
          account_id: string | null
          form_id: string | null
          response_date: string | null
          responses_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_accept_response: { Args: { form_uuid: string }; Returns: boolean }
      can_create_form: {
        Args: { account_uuid?: string; project_uuid: string }
        Returns: boolean
      }
      can_create_project: { Args: { account_uuid: string }; Returns: boolean }
      generate_short_url: { Args: never; Returns: string }
      get_account_responses_count: {
        Args: { account_uuid: string; start_date?: string }
        Returns: number
      }
      get_project_usage_summary: {
        Args: { account_uuid: string }
        Returns: {
          forms_count: number
          project_id: string
          qr_codes_count: number
          responses_count: number
        }[]
      }
      get_user_account_id: { Args: never; Returns: string }
      get_user_dashboard_summary: {
        Args: never
        Returns: {
          account_id: string | null
          first_response_at: string | null
          forms_count: number | null
          latest_response_at: string | null
          project_id: string | null
          project_name: string | null
          qr_codes_count: number | null
          responses_last_30_days: number | null
          responses_last_7_days: number | null
          total_responses: number | null
          total_scans: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "dashboard_summary"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_form_analytics: {
        Args: never
        Returns: {
          account_id: string | null
          conversion_rate: number | null
          first_response_at: string | null
          form_id: string | null
          form_name: string | null
          latest_response_at: string | null
          qr_codes_count: number | null
          responses_last_30_days: number | null
          responses_last_7_days: number | null
          total_responses: number | null
          total_scans: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "form_analytics"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_response_trends: {
        Args: never
        Returns: {
          account_id: string | null
          form_id: string | null
          response_date: string | null
          responses_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "response_trends"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      increment_qr_scan: { Args: { qr_code_uuid: string }; Returns: undefined }
      log_audit_event:
        | {
            Args: {
              p_account_id: string
              p_action: string
              p_details?: Json
              p_resource_id?: string
              p_resource_type: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_account_id: string
              p_action: string
              p_details?: Json
              p_resource_id?: string
              p_resource_type: string
              p_user_id: string
            }
            Returns: string
          }
      refresh_dashboard_views: { Args: never; Returns: undefined }
      reorder_questions: {
        Args: {
          form_uuid: string
          order_indexes: number[]
          question_ids: string[]
        }
        Returns: undefined
      }
    }
    Enums: {
      question_type: "text" | "textarea" | "rating" | "choice" | "multiselect"
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
      question_type: ["text", "textarea", "rating", "choice", "multiselect"],
    },
  },
} as const
