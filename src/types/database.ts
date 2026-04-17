export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          created_at: string
          session_date: string
          session_type: string
          location: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          session_date: string
          session_type?: string
          location?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          session_date?: string
          session_type?: string
          location?: string | null
          notes?: string | null
          user_id?: string
        }
      }
      shots: {
        Row: {
          id: string
          session_id: string
          created_at: string
          contact: string[] | null
          miss_direction: string[] | null
          proximity: string | null
          lie_surface: string | null
          lie_slope: string[] | null
          ball_position: string[] | null
          club: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          session_id: string
          created_at?: string
          contact?: string | null
          miss_direction?: string[] | null
          proximity?: string | null
          lie_surface?: string | null
          lie_slope?: string[] | null
          ball_position?: string[] | null
          club?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          created_at?: string
          contact?: string | null
          miss_direction?: string[] | null
          proximity?: string | null
          lie_surface?: string | null
          lie_slope?: string[] | null
          ball_position?: string[] | null
          club?: string | null
          notes?: string | null
        }
      }
    }
  }
}
