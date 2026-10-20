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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      chamado_leituras: {
        Row: {
          chamado_numero: number
          usuario_id: string
          visto_em: string
        }
        Insert: {
          chamado_numero: number
          usuario_id: string
          visto_em: string
        }
        Update: {
          chamado_numero?: number
          usuario_id?: string
          visto_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamado_leituras_chamado_numero_fkey"
            columns: ["chamado_numero"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["numero"]
          },
          {
            foreignKeyName: "chamado_leituras_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chamado_movimentacoes: {
        Row: {
          autor_id: string
          autor_nome: string
          chamado_numero: number
          criado_em: string
          id: string
          perfil: string
          status_anterior: string | null
          status_novo: string | null
          texto: string | null
        }
        Insert: {
          autor_id?: string
          autor_nome?: string
          chamado_numero: number
          criado_em?: string
          id?: string
          perfil?: string
          status_anterior?: string | null
          status_novo?: string | null
          texto?: string | null
        }
        Update: {
          autor_id?: string
          autor_nome?: string
          chamado_numero?: number
          criado_em?: string
          id?: string
          perfil?: string
          status_anterior?: string | null
          status_novo?: string | null
          texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chamado_movimentacoes_chamado_numero_fkey"
            columns: ["chamado_numero"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["numero"]
          },
        ]
      }
      chamados: {
        Row: {
          anexos: string[]
          ano: string | null
          conf_dados: boolean
          conf_envio: boolean
          conf_motivo: boolean
          cpf: string
          criado_em: string
          data_envio: string
          despachado_em: string | null
          destino: string | null
          endereco: string
          id_delivery: string | null
          motivo_cancelamento: string | null
          motivo_correios: string | null
          motivo_outro: string | null
          motivos: string[]
          novo_rastreio: string | null
          numero: number
          observacao: string | null
          origem_solicitacao: string
          pax_id: string
          pax_nome: string
          rastreio: string
          requer_pagamento: boolean | null
          requer_reenvio: boolean | null
          responsavel: string
          solicitante: string
          solicitante_id: string
          status: string
          status_pagamento: string | null
          valor_frete: number | null
        }
        Insert: {
          anexos?: string[]
          ano?: string | null
          conf_dados?: boolean
          conf_envio?: boolean
          conf_motivo?: boolean
          cpf: string
          criado_em?: string
          data_envio: string
          despachado_em?: string | null
          destino?: string | null
          endereco: string
          id_delivery?: string | null
          motivo_cancelamento?: string | null
          motivo_correios?: string | null
          motivo_outro?: string | null
          motivos?: string[]
          novo_rastreio?: string | null
          numero?: number
          observacao?: string | null
          origem_solicitacao?: string
          pax_id: string
          pax_nome: string
          rastreio: string
          requer_pagamento?: boolean | null
          requer_reenvio?: boolean | null
          responsavel: string
          solicitante?: string
          solicitante_id?: string
          status?: string
          status_pagamento?: string | null
          valor_frete?: number | null
        }
        Update: {
          anexos?: string[]
          ano?: string | null
          conf_dados?: boolean
          conf_envio?: boolean
          conf_motivo?: boolean
          cpf?: string
          criado_em?: string
          data_envio?: string
          despachado_em?: string | null
          destino?: string | null
          endereco?: string
          id_delivery?: string | null
          motivo_cancelamento?: string | null
          motivo_correios?: string | null
          motivo_outro?: string | null
          motivos?: string[]
          novo_rastreio?: string | null
          numero?: number
          observacao?: string | null
          origem_solicitacao?: string
          pax_id?: string
          pax_nome?: string
          rastreio?: string
          requer_pagamento?: boolean | null
          requer_reenvio?: boolean | null
          responsavel?: string
          solicitante?: string
          solicitante_id?: string
          status?: string
          status_pagamento?: string | null
          valor_frete?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aprovado: boolean
          created_at: string
          email: string | null
          id: string
          nome: string
        }
        Insert: {
          aprovado?: boolean
          created_at?: string
          email?: string | null
          id: string
          nome?: string
        }
        Update: {
          aprovado?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      reversos: {
        Row: {
          anexos: Json
          ano: string
          autorizacao_mandae: string
          cpf: string
          criado_em: string
          destino: string
          id_delivery: string
          motivos: string[]
          numero: number
          observacao: string | null
          origem_solicitacao: string[]
          pax_id: string
          pax_nome: string
          perfil_origem: string
          rastreamento_mandae: string
          responsavel: string
          solicitante: string
          solicitante_id: string
          status: string
        }
        Insert: {
          anexos?: Json
          ano: string
          autorizacao_mandae: string
          cpf: string
          criado_em?: string
          destino: string
          id_delivery: string
          motivos: string[]
          numero?: number
          observacao?: string | null
          origem_solicitacao: string[]
          pax_id: string
          pax_nome: string
          perfil_origem: string
          rastreamento_mandae: string
          responsavel: string
          solicitante: string
          solicitante_id: string
          status?: string
        }
        Update: {
          anexos?: Json
          ano?: string
          autorizacao_mandae?: string
          cpf?: string
          criado_em?: string
          destino?: string
          id_delivery?: string
          motivos?: string[]
          numero?: number
          observacao?: string | null
          origem_solicitacao?: string[]
          pax_id?: string
          pax_nome?: string
          perfil_origem?: string
          rastreamento_mandae?: string
          responsavel?: string
          solicitante?: string
          solicitante_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reversos_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissoes: {
        Row: {
          id: string
          permissao: Database["public"]["Enums"]["app_permissao"]
          user_id: string
        }
        Insert: {
          id?: string
          permissao: Database["public"]["Enums"]["app_permissao"]
          user_id: string
        }
        Update: {
          id?: string
          permissao?: Database["public"]["Enums"]["app_permissao"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      admin_definir_usuario: {
        Args: {
          _aprovado: boolean
          _id: string
          _papel: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      admin_definir_usuario_v2: {
        Args: {
          _aprovado: boolean
          _id: string
          _papel: Database["public"]["Enums"]["app_role"]
          _permissoes: string[]
        }
        Returns: undefined
      }
      admin_listar_usuarios: {
        Args: never
        Returns: {
          aprovado: boolean
          created_at: string
          email: string
          id: string
          nome: string
          papeis: string[]
        }[]
      }
      admin_listar_usuarios_v2: {
        Args: never
        Returns: {
          aprovado: boolean
          created_at: string
          email: string
          id: string
          nome: string
          papeis: string[]
          permissoes: string[]
        }[]
      }
      despachar_chamado: {
        Args: { _numero: number; _rastreio: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      meu_status_aprovacao: { Args: never; Returns: boolean }
      minhas_permissoes: { Args: never; Returns: string[] }
      tem_permissao: {
        Args: {
          _perm: Database["public"]["Enums"]["app_permissao"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_permissao: "consulta" | "chamados" | "reenvios" | "pagamentos"
      app_role: "lojinha" | "sac" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_permissao: ["consulta", "chamados", "reenvios", "pagamentos"],
      app_role: ["lojinha", "sac", "admin"],
    },
  },
} as const
