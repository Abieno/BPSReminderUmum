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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      akses_app: {
        Row: {
          id: boolean
          sandi: string
          updated_at: string
        }
        Insert: {
          id?: boolean
          sandi?: string
          updated_at?: string
        }
        Update: {
          id?: boolean
          sandi?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          gateway_provider: string
          id: boolean
          updated_at: string
          wa_admin: string
        }
        Insert: {
          created_at?: string
          gateway_provider?: string
          id?: boolean
          updated_at?: string
          wa_admin?: string
        }
        Update: {
          created_at?: string
          gateway_provider?: string
          id?: boolean
          updated_at?: string
          wa_admin?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          golongan: string
          id: string
          jabatan: string
          nama: string
          nip: string
          no_wa: string
          tmt: string 
          unit_kerja: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          golongan?: string
          id?: string
          jabatan?: string
          nama: string
          nip: string
          no_wa?: string
          tmt?: string
          unit_kerja?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          golongan?: string
          id?: string
          jabatan?: string
          nama?: string
          nip?: string
          no_wa?: string
          tmt?: string
          unit_kerja?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          created_at: string
          employee_id: string | null
          employee_nama: string
          error: string | null
          hari_sebelum: number | null
          id: string
          jenis: Database["public"]["Enums"]["reminder_jenis"]
          manual: boolean
          no_wa: string
          pesan: string
          reminder_id: string | null
          status: string
          tanggal_kirim: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          employee_nama?: string
          error?: string | null
          hari_sebelum?: number | null
          id?: string
          jenis: Database["public"]["Enums"]["reminder_jenis"]
          manual?: boolean
          no_wa?: string
          pesan?: string
          reminder_id?: string | null
          status?: string
          tanggal_kirim?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          employee_nama?: string
          error?: string | null
          hari_sebelum?: number | null
          id?: string
          jenis?: Database["public"]["Enums"]["reminder_jenis"]
          manual?: boolean
          no_wa?: string
          pesan?: string
          reminder_id?: string | null
          status?: string
          tanggal_kirim?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_schedules: {
        Row: {
          created_at: string
          hari_sebelum: number
          id: string
          reminder_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hari_sebelum: number
          id?: string
          reminder_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hari_sebelum?: number
          id?: string
          reminder_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_schedules_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          aktif: boolean
          created_at: string
          employee_id: string
          id: string
          jenis: Database["public"]["Enums"]["reminder_jenis"]
          tanggal: string
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          employee_id: string
          id?: string
          jenis: Database["public"]["Enums"]["reminder_jenis"]
          tanggal: string
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          employee_id?: string
          id?: string
          jenis?: Database["public"]["Enums"]["reminder_jenis"]
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      reminder_jenis: "kenaikan_pangkat" | "kenaikan_gaji_berkala"
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
      reminder_jenis: ["kenaikan_pangkat", "kenaikan_gaji_berkala"],
    },
  },
} as const
